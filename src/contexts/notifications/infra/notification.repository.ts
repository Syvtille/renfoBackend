import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationModel, NotificationType } from '../domain/notification.model';
import { NotificationRepositoryPort } from '../app/ports/notification.repository.port';

@Injectable()
export class NotificationRepository implements NotificationRepositoryPort {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
  ) {}

  private toModel(e: NotificationEntity): NotificationModel {
    return new NotificationModel(
      e.id, e.userId, e.type as NotificationType, e.title, e.body, e.data, e.isRead, e.createdAt,
    );
  }

  async save(notification: Partial<NotificationModel>): Promise<NotificationModel> {
    const e = await this.repo.save(notification as Partial<NotificationEntity>);
    return this.toModel(e);
  }

  async findByUserId(userId: string, onlyUnread = false): Promise<NotificationModel[]> {
    const where: any = { userId };
    if (onlyUnread) where.isRead = false;
    const entities = await this.repo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return entities.map((e) => this.toModel(e));
  }

  async markAsRead(id: string): Promise<void> {
    await this.repo.update(id, { isRead: true });
  }
}
