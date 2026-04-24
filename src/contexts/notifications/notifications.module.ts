import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './infra/entities/notification.entity';
import { NotificationRepository } from './infra/notification.repository';
import { NOTIFICATION_REPOSITORY } from './app/ports/notification.repository.port';
import { CreateNotificationUseCase } from './app/usecases/create-notification.usecase';
import { GetNotificationsUseCase } from './app/usecases/get-notifications.usecase';
import { MarkNotificationReadUseCase } from './app/usecases/mark-notification-read.usecase';
import { NotificationEmitter } from './api/notification.emitter';
import { NotificationsController } from './api/notifications.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),
    AuthModule,
  ],
  controllers: [NotificationsController],
  providers: [
    { provide: NOTIFICATION_REPOSITORY, useClass: NotificationRepository },
    CreateNotificationUseCase,
    GetNotificationsUseCase,
    MarkNotificationReadUseCase,
    NotificationEmitter,
  ],
  exports: [CreateNotificationUseCase, NotificationEmitter],
})
export class NotificationsModule {}
