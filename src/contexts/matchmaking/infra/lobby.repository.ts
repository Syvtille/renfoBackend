import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { LobbyEntity } from './entities/lobby.entity';
import { LobbyModel, LobbyStatus } from '../domain/lobby.model';
import { LobbyRepositoryPort } from '../app/ports/lobby.repository.port';

@Injectable()
export class LobbyRepository implements LobbyRepositoryPort {
  constructor(
    @InjectRepository(LobbyEntity)
    private readonly repo: Repository<LobbyEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private toModel(entity: LobbyEntity): LobbyModel {
    return new LobbyModel(
      entity.id,
      entity.topic,
      entity.playerForId,
      entity.playerAgainstId,
      entity.refereeId,
      entity.status,
      entity.winnerId,
      entity.startedAt,
      entity.createdAt,
      entity.version,
    );
  }

  private toEntity(model: Partial<LobbyModel>): Partial<LobbyEntity> {
    return { ...model } as Partial<LobbyEntity>;
  }

  async findById(id: string): Promise<LobbyModel | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toModel(entity) : null;
  }

  async findWaitingLobbyForPlayer(excludeUserId: string): Promise<LobbyModel | null> {
    const entity = await this.repo
      .createQueryBuilder('lobby')
      .where('lobby.status = :status', { status: LobbyStatus.WAITING })
      .andWhere('lobby.playerForId IS NOT NULL')
      .andWhere('lobby.playerAgainstId IS NULL')
      .andWhere('lobby.playerForId != :excludeUserId', { excludeUserId })
      .getOne();
    return entity ? this.toModel(entity) : null;
  }

  async findWaitingLobbyForReferee(): Promise<LobbyModel | null> {
    const entity = await this.repo
      .createQueryBuilder('lobby')
      .where('lobby.status = :status', { status: LobbyStatus.WAITING })
      .andWhere('lobby.playerForId IS NOT NULL')
      .andWhere('lobby.playerAgainstId IS NOT NULL')
      .andWhere('lobby.refereeId IS NULL')
      .getOne();
    return entity ? this.toModel(entity) : null;
  }

  async findActiveByUserId(userId: string): Promise<LobbyModel | null> {
    const entity = await this.repo
      .createQueryBuilder('lobby')
      .where('lobby.status IN (:...statuses)', {
        statuses: [LobbyStatus.WAITING, LobbyStatus.IN_PROGRESS],
      })
      .andWhere(
        '(lobby.playerForId = :id OR lobby.playerAgainstId = :id OR lobby.refereeId = :id)',
        { id: userId },
      )
      .getOne();
    return entity ? this.toModel(entity) : null;
  }

  async save(lobby: Partial<LobbyModel>): Promise<LobbyModel> {
    const entity = await this.repo.save(this.toEntity(lobby));
    return this.toModel(entity);
  }

  /**
   * FIX RC-2 (Lost Update / TOCTOU) : toute la séquence check-then-act
   * s'exécute dans une transaction SERIALIZABLE avec verrou pessimiste.
   *
   * Sans verrou : deux joueurs peuvent lire le même lobby "libre" simultanément,
   * tous les deux rejoindre et écraser la valeur de l'autre (lost update).
   * Avec SELECT FOR UPDATE : le deuxième joueur est bloqué jusqu'à la fin
   * de la transaction du premier — il voit alors le lobby déjà complet.
   */
  async joinPlayerAtomically(
    userId: string,
    topic: string,
  ): Promise<{ lobby: LobbyModel; position: 'for' | 'against' }> {
    return await this.dataSource.transaction('SERIALIZABLE', async (manager: EntityManager) => {
      // 1. Vérifier si l'utilisateur est déjà dans un lobby actif (avec verrou)
      const active = await manager
        .createQueryBuilder(LobbyEntity, 'lobby')
        .where('lobby.status IN (:...statuses)', {
          statuses: [LobbyStatus.WAITING, LobbyStatus.IN_PROGRESS],
        })
        .andWhere(
          '(lobby.playerForId = :id OR lobby.playerAgainstId = :id OR lobby.refereeId = :id)',
          { id: userId },
        )
        .setLock('pessimistic_write')
        .getOne();

      if (active) {
        const position = active.playerForId === userId ? ('for' as const) : ('against' as const);
        return { lobby: this.toModel(active), position };
      }

      // 2. Chercher un lobby en attente (avec verrou — empêche deux joueurs de prendre le même)
      const existing = await manager
        .createQueryBuilder(LobbyEntity, 'lobby')
        .where('lobby.status = :status', { status: LobbyStatus.WAITING })
        .andWhere('lobby.playerForId IS NOT NULL')
        .andWhere('lobby.playerAgainstId IS NULL')
        .andWhere('lobby.playerForId != :excludeUserId', { excludeUserId: userId })
        .setLock('pessimistic_write')
        .getOne();

      if (existing) {
        existing.playerAgainstId = userId;
        const saved = await manager.save(LobbyEntity, existing);
        return { lobby: this.toModel(saved), position: 'against' as const };
      }

      // 3. Créer un nouveau lobby
      const newLobby = manager.create(LobbyEntity, {
        topic,
        playerForId: userId,
        status: LobbyStatus.WAITING,
      });
      const saved = await manager.save(LobbyEntity, newLobby);
      return { lobby: this.toModel(saved), position: 'for' as const };
    });
  }

  /**
   * FIX RC-3 (TOCTOU) : même principe pour l'arbitre.
   * Verrou pessimiste sur le lobby trouvé avant de l'assigner à l'arbitre.
   */
  async joinRefereeAtomically(userId: string): Promise<LobbyModel> {
    return await this.dataSource.transaction('SERIALIZABLE', async (manager: EntityManager) => {
      // Vérifier si l'arbitre est déjà dans un lobby actif
      const alreadyActive = await manager
        .createQueryBuilder(LobbyEntity, 'lobby')
        .where('lobby.status IN (:...statuses)', {
          statuses: [LobbyStatus.WAITING, LobbyStatus.IN_PROGRESS],
        })
        .andWhere(
          '(lobby.playerForId = :id OR lobby.playerAgainstId = :id OR lobby.refereeId = :id)',
          { id: userId },
        )
        .setLock('pessimistic_write')
        .getOne();

      if (alreadyActive) {
        throw new Error('ALREADY_ACTIVE');
      }

      // Chercher un lobby avec deux joueurs et sans arbitre (avec verrou)
      const lobby = await manager
        .createQueryBuilder(LobbyEntity, 'lobby')
        .where('lobby.status = :status', { status: LobbyStatus.WAITING })
        .andWhere('lobby.playerForId IS NOT NULL')
        .andWhere('lobby.playerAgainstId IS NOT NULL')
        .andWhere('lobby.refereeId IS NULL')
        .setLock('pessimistic_write')
        .getOne();

      if (!lobby) {
        throw new Error('NO_LOBBY_AVAILABLE');
      }

      lobby.refereeId = userId;
      lobby.status = LobbyStatus.IN_PROGRESS;
      lobby.startedAt = new Date();
      const saved = await manager.save(LobbyEntity, lobby);
      return this.toModel(saved);
    });
  }
}
