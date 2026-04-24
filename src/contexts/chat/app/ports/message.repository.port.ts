import { MessageModel } from '../../domain/message.model.js';

export abstract class MessageRepositoryPort {
  abstract save(message: Partial<MessageModel>): Promise<MessageModel>;
  abstract findByLobbyId(lobbyId: string): Promise<MessageModel[]>;
}

export const MESSAGE_REPOSITORY = Symbol('MESSAGE_REPOSITORY');
