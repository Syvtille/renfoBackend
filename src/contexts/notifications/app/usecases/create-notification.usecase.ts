import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY,
  NotificationRepositoryPort,
} from '../ports/notification.repository.port';
import { NotificationType } from '../../domain/notification.model';
import { NotificationEmitter } from '../../api/notification.emitter';

@Injectable()
export class CreateNotificationUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifRepo: NotificationRepositoryPort,
    private readonly emitter: NotificationEmitter,
  ) {}

  async execute(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    const notification = await this.notifRepo.save({
      userId,
      type,
      title,
      body,
      data: data ? JSON.stringify(data) : null,
    });

    // Push en temps réel via SSE
    this.emitter.emit(userId, notification);

    return notification;
  }
}
