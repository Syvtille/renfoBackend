import { Inject, Injectable } from '@nestjs/common';
import {
  MESSAGE_REPOSITORY,
  MessageRepositoryPort,
} from '../ports/message.repository.port';

@Injectable()
export class GetLobbyMessagesUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepo: MessageRepositoryPort,
  ) {}

  async execute(lobbyId: string) {
    return this.messageRepo.findByLobbyId(lobbyId);
  }
}
