import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ConversationEntity } from './entities/conversation.entity';
import { ConversationModel } from '../domain/conversation.model';
import { ConversationRepositoryPort } from '../app/ports/conversation.repository.port';

@Injectable()
export class ConversationRepository implements ConversationRepositoryPort {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly repo: Repository<ConversationEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private toModel(e: ConversationEntity): ConversationModel {
    return new ConversationModel(e.id, e.user1Id, e.user2Id, e.lastMessageAt, e.createdAt);
  }

  async findByUserId(userId: string): Promise<ConversationModel[]> {
    const entities = await this.repo.find({
      where: [{ user1Id: userId }, { user2Id: userId }],
      order: { lastMessageAt: 'DESC' },
    });
    return entities.map((e) => this.toModel(e));
  }

  async findById(id: string): Promise<ConversationModel | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? this.toModel(e) : null;
  }

  async findByParticipants(user1Id: string, user2Id: string): Promise<ConversationModel | null> {
    const e = await this.repo.findOne({
      where: [
        { user1Id, user2Id },
        { user1Id: user2Id, user2Id: user1Id },
      ],
    });
    return e ? this.toModel(e) : null;
  }

  async save(conversation: Partial<ConversationModel>): Promise<ConversationModel> {
    const e = await this.repo.save(conversation as Partial<ConversationEntity>);
    return this.toModel(e);
  }

  async updateLastMessageAt(id: string, date: Date): Promise<void> {
    await this.repo.update(id, { lastMessageAt: date });
  }

  /**
   * FIX RC-5 (Race condition find-or-create) :
   * Exécute le find-or-create dans une transaction SERIALIZABLE.
   *
   * Problème original : si Alice envoie un DM à Bob et Bob envoie un DM à Alice
   * exactement en même temps, les deux threads lisent "pas de conversation"
   * et tous les deux en créent une → conversations dupliquées.
   *
   * Solution : isolation SERIALIZABLE — PostgreSQL détecte l'anomalie de
   * sérialisation et annule une des transactions (code 40001). On retente
   * jusqu'à 3 fois. Après le premier commit, le second thread trouvera la
   * conversation existante.
   */
  async findOrCreateConversation(user1Id: string, user2Id: string): Promise<ConversationModel> {
    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await this.dataSource.transaction('SERIALIZABLE', async (manager: EntityManager) => {
          const existing = await manager.getRepository(ConversationEntity).findOne({
            where: [
              { user1Id, user2Id },
              { user1Id: user2Id, user2Id: user1Id },
            ],
          });

          if (existing) return this.toModel(existing);

          const newConv = manager.create(ConversationEntity, { user1Id, user2Id });
          const saved = await manager.save(ConversationEntity, newConv);
          return this.toModel(saved);
        });
      } catch (err: any) {
        // Code 40001 : PostgreSQL serialization failure — on retente
        if (err?.code === '40001' && attempt < MAX_RETRIES - 1) continue;
        throw err;
      }
    }

    throw new Error('Failed to find or create conversation after retries');
  }
}
