import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY,
  NotificationRepositoryPort,
} from '../ports/notification.repository.port';

@Injectable()
export class GetNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifRepo: NotificationRepositoryPort,
  ) {}

  async execute(userId: string, onlyUnread = false) {
    return this.notifRepo.findByUserId(userId, onlyUnread);
  }
}
