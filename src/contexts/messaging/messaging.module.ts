import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity } from './infra/entities/conversation.entity';
import { DirectMessageEntity } from './infra/entities/direct-message.entity';
import { ContactEntity } from './infra/entities/contact.entity';
import { ConversationRepository } from './infra/conversation.repository';
import { DirectMessageRepository } from './infra/direct-message.repository';
import { ContactRepository } from './infra/contact.repository';
import { CONVERSATION_REPOSITORY } from './app/ports/conversation.repository.port';
import { DIRECT_MESSAGE_REPOSITORY } from './app/ports/direct-message.repository.port';
import { CONTACT_REPOSITORY } from './app/ports/contact.repository.port';
import { SendDirectMessageUseCase } from './app/usecases/send-direct-message.usecase';
import { GetConversationsUseCase } from './app/usecases/get-conversations.usecase';
import { GetDirectMessagesUseCase } from './app/usecases/get-direct-messages.usecase';
import { MarkMessagesReadUseCase } from './app/usecases/mark-messages-read.usecase';
import { AddContactUseCase } from './app/usecases/add-contact.usecase';
import { RemoveContactUseCase } from './app/usecases/remove-contact.usecase';
import { ListContactsUseCase } from './app/usecases/list-contacts.usecase';
import { MessagingGateway } from './api/messaging.gateway';
import { MessagingController } from './api/messaging.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationEntity, DirectMessageEntity, ContactEntity]),
    AuthModule,
  ],
  controllers: [MessagingController],
  providers: [
    { provide: CONVERSATION_REPOSITORY, useClass: ConversationRepository },
    { provide: DIRECT_MESSAGE_REPOSITORY, useClass: DirectMessageRepository },
    { provide: CONTACT_REPOSITORY, useClass: ContactRepository },
    SendDirectMessageUseCase,
    GetConversationsUseCase,
    GetDirectMessagesUseCase,
    MarkMessagesReadUseCase,
    AddContactUseCase,
    RemoveContactUseCase,
    ListContactsUseCase,
    MessagingGateway,
  ],
  exports: [SendDirectMessageUseCase],
})
export class MessagingModule {}
