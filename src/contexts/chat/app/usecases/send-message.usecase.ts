import { Inject, Injectable } from '@nestjs/common';
import {
  MESSAGE_REPOSITORY,
  MessageRepositoryPort,
} from '../ports/message.repository.port';
import { MessageType } from '../../domain/message.model';

@Injectable()
export class SendMessageUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepo: MessageRepositoryPort,
  ) {}

  async execute(
    lobbyId: string,
    senderId: string,
    senderUsername: string,
    content: string,
    type: MessageType = MessageType.CHAT,
  ) {
    return this.messageRepo.save({
      lobbyId,
      senderId,
      senderUsername,
      content,
      type,
    });
  }
}
