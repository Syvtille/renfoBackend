import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './core/database/database.module';
import { RedisModule } from './core/cache/redis.module';
import { BloomModule } from './core/bloom/bloom.module';
import { MailerModule } from './core/mailer/mailer.module';
import { LockModule } from './core/lock/lock.module';
import { AuthModule } from './contexts/auth/auth.module';
import { MatchmakingModule } from './contexts/matchmaking/matchmaking.module';
import { ChatModule } from './contexts/chat/chat.module';
import { MessagingModule } from './contexts/messaging/messaging.module';
import { NotificationsModule } from './contexts/notifications/notifications.module';
import { PaymentModule } from './contexts/payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RedisModule,
    BloomModule,
    MailerModule,
    LockModule,
    AuthModule,
    MatchmakingModule,
    ChatModule,
    MessagingModule,
    NotificationsModule,
    PaymentModule,
  ],
})
export class AppModule {}
