/**
 * Types de notifications push.
 */
export enum NotificationType {
  NEW_MESSAGE = 'new_message',
  LOBBY_READY = 'lobby_ready',
  GAME_OVER = 'game_over',
  CONTACT_REQUEST = 'contact_request',
  SYSTEM = 'system',
}

/**
 * Modèle de domaine Notification.
 */
export class NotificationModel {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: NotificationType,
    public readonly title: string,
    public readonly body: string,
    public readonly data: string | null,
    public readonly isRead: boolean,
    public readonly createdAt: Date,
  ) {}
}
