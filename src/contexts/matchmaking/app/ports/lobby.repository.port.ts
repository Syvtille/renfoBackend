import { LobbyModel } from '../../domain/lobby.model.js';

export abstract class LobbyRepositoryPort {
  abstract findById(id: string): Promise<LobbyModel | null>;
  abstract findWaitingLobbyForPlayer(excludeUserId: string): Promise<LobbyModel | null>;
  abstract findWaitingLobbyForReferee(): Promise<LobbyModel | null>;
  abstract findActiveByUserId(userId: string): Promise<LobbyModel | null>;
  abstract save(lobby: Partial<LobbyModel>): Promise<LobbyModel>;

  /**
   * FIX RC-2 (Lost Update / TOCTOU) : exécute le find-and-join dans une seule
   * transaction avec verrou pessimiste (SELECT FOR UPDATE) pour garantir qu'un seul
   * joueur peut rejoindre un lobby donné, même en cas de requêtes simultanées.
   */
  abstract joinPlayerAtomically(
    userId: string,
    topic: string,
  ): Promise<{ lobby: LobbyModel; position: 'for' | 'against' }>;

  /**
   * FIX RC-3 (TOCTOU) : idem pour l'arbitre — find + assign dans une transaction
   * avec verrou pessimiste pour éviter que deux arbitres rejoignent le même lobby.
   */
  abstract joinRefereeAtomically(userId: string): Promise<LobbyModel>;
}

export const LOBBY_REPOSITORY = Symbol('LOBBY_REPOSITORY');
