import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/jwt/jwt-auth.guard';
import { Observable, map } from 'rxjs';
import { GetNotificationsUseCase } from '../app/usecases/get-notifications.usecase';
import { MarkNotificationReadUseCase } from '../app/usecases/mark-notification-read.usecase';
import { NotificationEmitter } from './notification.emitter';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly getNotifications: GetNotificationsUseCase,
    private readonly markRead: MarkNotificationReadUseCase,
    private readonly emitter: NotificationEmitter,
  ) {}

  /**
   * Endpoint SSE — le client s'abonne pour recevoir les notifications en temps réel.
   * Usage côté client :
   *   const es = new EventSource('/notifications/stream?token=<JWT>');
   *   es.addEventListener('notification', (e) => console.log(JSON.parse(e.data)));
   */
  @Sse('stream')
  stream(@Req() req: any): Observable<MessageEvent> {
    const userId = req.user.userId;
    return this.emitter.getStream(userId).pipe(
      map((notification) => ({
        data: JSON.stringify(notification),
        type: 'notification',
        id: notification.id,
      }) as any),
    );
  }

  /** Liste des notifications (toutes ou non-lues seulement) */
  @Get()
  getAll(@Req() req: any, @Query('unread') unread?: string) {
    return this.getNotifications.execute(req.user.userId, unread === 'true');
  }

  /** Marquer une notification comme lue */
  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.markRead.execute(id);
  }
}
