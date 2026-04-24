import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import {
  LOBBY_REPOSITORY,
  LobbyRepositoryPort,
} from '../ports/lobby.repository.port';

@Injectable()
export class JoinAsRefereeUseCase {
  constructor(
    @Inject(LOBBY_REPOSITORY) private readonly lobbyRepo: LobbyRepositoryPort,
  ) {}

  async execute(userId: string) {
    /**
     * FIX RC-3 (TOCTOU) : délègue à joinRefereeAtomically qui garantit
     * qu'un seul arbitre peut être assigné à un lobby donné, même si deux
     * arbitres tentent de rejoindre le même lobby simultanément.
     *
     * Ancienne implémentation vulnérable :
     *   1. findActiveByUserId()         → check "déjà actif ?"
     *   2. findWaitingLobbyForReferee() → trouve le lobby
     *   3. startDebate()                → modifie en mémoire
     *   4. save()                       → sauvegarde
     * Entre les étapes 2 et 4, un second arbitre pouvait trouver le même lobby.
     */
    try {
      const lobby = await this.lobbyRepo.joinRefereeAtomically(userId);
      return { lobby };
    } catch (err: any) {
      if (err?.message === 'ALREADY_ACTIVE') {
        throw new ConflictException('Already in an active lobby');
      }
      if (err?.message === 'NO_LOBBY_AVAILABLE') {
        throw new NotFoundException('No lobby available for a referee right now');
      }
      throw err;
    }
  }
}
