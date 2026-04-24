import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageEntity } from './entities/message.entity';
import { MessageModel, MessageType } from '../domain/message.model';
import { MessageRepositoryPort } from '../app/ports/message.repository.port';

@Injectable()
export class MessageRepository implements MessageRepositoryPort {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly repo: Repository<MessageEntity>,
  ) {}

  private toModel(entity: MessageEntity): MessageModel {
    return new MessageModel(
      entity.id,
      entity.lobbyId,
      entity.senderId,
      entity.senderUsername,
      entity.content,
      entity.type as MessageType,
      entity.createdAt,
    );
  }

  async save(message: Partial<MessageModel>): Promise<MessageModel> {
    const entity = await this.repo.save(message as Partial<MessageEntity>);
    return this.toModel(entity);
  }

  async findByLobbyId(lobbyId: string): Promise<MessageModel[]> {
    const entities = await this.repo.find({
      where: { lobbyId },
      order: { createdAt: 'ASC' },
    });
    return entities.map((e) => this.toModel(e));
  }
}
