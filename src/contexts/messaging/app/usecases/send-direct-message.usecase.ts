import { Inject, Injectable } from '@nestjs/common';
import {
  CONVERSATION_REPOSITORY,
  ConversationRepositoryPort,
} from '../ports/conversation.repository.port';
import {
  DIRECT_MESSAGE_REPOSITORY,
  DirectMessageRepositoryPort,
} from '../ports/direct-message.repository.port';

@Injectable()
export class SendDirectMessageUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly convRepo: ConversationRepositoryPort,
    @Inject(DIRECT_MESSAGE_REPOSITORY) private readonly dmRepo: DirectMessageRepositoryPort,
  ) {}

  async execute(senderId: string, senderUsername: string, recipientId: string, content: string) {
    /**
     * FIX RC-5 (Race condition find-or-create) : findOrCreateConversation exécute
     * la recherche et la création dans une transaction SERIALIZABLE atomique.
     * Ancienne implémentation : findByParticipants() puis save() séparés
     * → fenêtre de race condition si deux messages simultanés (même paire d'utilisateurs).
     */
    const conversation = await this.convRepo.findOrCreateConversation(senderId, recipientId);

    const message = await this.dmRepo.save({
      conversationId: conversation.id,
      senderId,
      senderUsername,
      content,
    });

    await this.convRepo.updateLastMessageAt(conversation.id, new Date());

    return { conversation, message };
  }
}
