import { NotificationModel } from '../../domain/notification.model';

export abstract class NotificationRepositoryPort {
  abstract save(notification: Partial<NotificationModel>): Promise<NotificationModel>;
  abstract findByUserId(userId: string, onlyUnread?: boolean): Promise<NotificationModel[]>;
  abstract markAsRead(id: string): Promise<void>;
}

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');
