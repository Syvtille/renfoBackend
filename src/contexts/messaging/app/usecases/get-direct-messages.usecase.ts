import { Inject, Injectable } from '@nestjs/common';
import {
  DIRECT_MESSAGE_REPOSITORY,
  DirectMessageRepositoryPort,
} from '../ports/direct-message.repository.port';

@Injectable()
export class GetDirectMessagesUseCase {
  constructor(
    @Inject(DIRECT_MESSAGE_REPOSITORY) private readonly dmRepo: DirectMessageRepositoryPort,
  ) {}

  async execute(conversationId: string, page = 1, limit = 50) {
    return this.dmRepo.findByConversationId(conversationId, page, limit);
  }
}
