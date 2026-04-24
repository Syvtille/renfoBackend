import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY,
  NotificationRepositoryPort,
} from '../ports/notification.repository.port';

@Injectable()
export class MarkNotificationReadUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifRepo: NotificationRepositoryPort,
  ) {}

  async execute(notificationId: string) {
    await this.notifRepo.markAsRead(notificationId);
  }
}
