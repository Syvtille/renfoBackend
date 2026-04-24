import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, IsNull, Repository } from 'typeorm';
import { DirectMessageEntity } from './entities/direct-message.entity';
import { DirectMessageModel } from '../domain/direct-message.model';
import { DirectMessageRepositoryPort } from '../app/ports/direct-message.repository.port';

@Injectable()
export class DirectMessageRepository implements DirectMessageRepositoryPort {
  constructor(
    @InjectRepository(DirectMessageEntity)
    private readonly repo: Repository<DirectMessageEntity>,
  ) {}

  private toModel(e: DirectMessageEntity): DirectMessageModel {
    return new DirectMessageModel(
      e.id, e.conversationId, e.senderId, e.senderUsername, e.content, e.readAt, e.createdAt,
    );
  }

  async save(message: Partial<DirectMessageModel>): Promise<DirectMessageModel> {
    const e = await this.repo.save(message as Partial<DirectMessageEntity>);
    return this.toModel(e);
  }

  async findByConversationId(conversationId: string, page: number, limit: number): Promise<DirectMessageModel[]> {
    const entities = await this.repo.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return entities.map((e) => this.toModel(e));
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(DirectMessageEntity)
      .set({ readAt: new Date() })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('senderId != :userId', { userId })
      .andWhere('readAt IS NULL')
      .execute();
  }
}
