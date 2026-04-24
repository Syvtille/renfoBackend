import { ConversationModel } from '../../domain/conversation.model';

export abstract class ConversationRepositoryPort {
  abstract findByUserId(userId: string): Promise<ConversationModel[]>;
  abstract findById(id: string): Promise<ConversationModel | null>;
  abstract findByParticipants(user1Id: string, user2Id: string): Promise<ConversationModel | null>;
  abstract save(conversation: Partial<ConversationModel>): Promise<ConversationModel>;
  abstract updateLastMessageAt(id: string, date: Date): Promise<void>;
  /**
   * FIX RC-5 (Lost Update / Duplicate creation) : trouve ou crée une conversation
   * de façon atomique dans une transaction SERIALIZABLE.
   * Empêche la création de conversations dupliquées lorsque deux utilisateurs
   * s'envoient des messages simultanément pour la première fois.
   */
  abstract findOrCreateConversation(user1Id: string, user2Id: string): Promise<ConversationModel>;
}

export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');
