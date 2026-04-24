import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageEntity } from './infra/entities/message.entity';
import { MessageRepository } from './infra/message.repository';
import { MESSAGE_REPOSITORY } from './app/ports/message.repository.port';
import { SendMessageUseCase } from './app/usecases/send-message.usecase';
import { GetLobbyMessagesUseCase } from './app/usecases/get-lobby-messages.usecase';
import { ChatGateway } from './api/chat.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity]), AuthModule],
  providers: [
    { provide: MESSAGE_REPOSITORY, useClass: MessageRepository },
    SendMessageUseCase,
    GetLobbyMessagesUseCase,
    ChatGateway,
  ],
  exports: [ChatGateway],
})
export class ChatModule {}
