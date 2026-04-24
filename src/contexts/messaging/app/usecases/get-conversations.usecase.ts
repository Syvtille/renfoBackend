import { Inject, Injectable } from '@nestjs/common';
import {
  CONVERSATION_REPOSITORY,
  ConversationRepositoryPort,
} from '../ports/conversation.repository.port';

@Injectable()
export class GetConversationsUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly convRepo: ConversationRepositoryPort,
  ) {}

  async execute(userId: string) {
    return this.convRepo.findByUserId(userId);
  }
}
