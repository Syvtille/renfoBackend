import { Inject, Injectable } from '@nestjs/common';
import {
  DIRECT_MESSAGE_REPOSITORY,
  DirectMessageRepositoryPort,
} from '../ports/direct-message.repository.port';

@Injectable()
export class MarkMessagesReadUseCase {
  constructor(
    @Inject(DIRECT_MESSAGE_REPOSITORY) private readonly dmRepo: DirectMessageRepositoryPort,
  ) {}

  async execute(conversationId: string, userId: string) {
    await this.dmRepo.markAsRead(conversationId, userId);
  }
}
