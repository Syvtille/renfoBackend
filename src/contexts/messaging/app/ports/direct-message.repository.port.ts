import { DirectMessageModel } from '../../domain/direct-message.model';

export abstract class DirectMessageRepositoryPort {
  abstract save(message: Partial<DirectMessageModel>): Promise<DirectMessageModel>;
  abstract findByConversationId(conversationId: string, page: number, limit: number): Promise<DirectMessageModel[]>;
  abstract markAsRead(conversationId: string, userId: string): Promise<void>;
}

export const DIRECT_MESSAGE_REPOSITORY = Symbol('DIRECT_MESSAGE_REPOSITORY');
