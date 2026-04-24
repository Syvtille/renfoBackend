import { Inject, Injectable } from '@nestjs/common';
import { LOBBY_REPOSITORY, LobbyRepositoryPort } from '../ports/lobby.repository.port';
import { TOPIC_REPOSITORY, TopicRepositoryPort } from '../ports/topic.repository.port';
import { STATIC_TOPICS } from '../../domain/topic.data';

@Injectable()
export class JoinAsPlayerUseCase {
  constructor(
    @Inject(LOBBY_REPOSITORY) private readonly lobbyRepo: LobbyRepositoryPort,
    @Inject(TOPIC_REPOSITORY) private readonly topicRepo: TopicRepositoryPort,
  ) {}

  async execute(userId: string) {
    /**
     * FIX RC-2 (Lost Update / TOCTOU) : délègue toute la logique find-and-join
     * à joinPlayerAtomically qui exécute le check-then-act dans une transaction
     * SERIALIZABLE avec verrou pessimiste (SELECT FOR UPDATE).
     *
     * Ancienne implémentation vulnérable :
     *   1. findWaitingLobbyForPlayer() → lit le lobby
     *   2. addPlayerAgainst()          → modifie en mémoire
     *   3. save()                      → sauvegarde
     * Si deux joueurs exécutent ces étapes en parallèle, ils voient tous les deux
     * le même lobby "libre" et l'écrasent mutuellement (lost update).
     */
    const dbTopic = await this.topicRepo.findRandom();
    const topic = dbTopic
      ? dbTopic.content
      : STATIC_TOPICS[Math.floor(Math.random() * STATIC_TOPICS.length)];

    return await this.lobbyRepo.joinPlayerAtomically(userId, topic);
  }
}
