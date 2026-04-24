import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LobbyEntity } from './infra/entities/lobby.entity';
import { TopicEntity } from './infra/entities/topic.entity';
import { LobbyRepository } from './infra/lobby.repository';
import { TopicRepository } from './infra/topic.repository';
import { LOBBY_REPOSITORY } from './app/ports/lobby.repository.port';
import { TOPIC_REPOSITORY } from './app/ports/topic.repository.port';
import { JoinAsPlayerUseCase } from './app/usecases/join-as-player.usecase';
import { JoinAsRefereeUseCase } from './app/usecases/join-as-referee.usecase';
import { DesignateWinnerUseCase } from './app/usecases/designate-winner.usecase';
import { CreateTopicUseCase } from './app/usecases/create-topic.usecase';
import { ListTopicsUseCase } from './app/usecases/list-topics.usecase';
import { MatchmakingController } from './api/matchmaking.controller';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [TypeOrmModule.forFeature([LobbyEntity, TopicEntity]), AuthModule, ChatModule],
  controllers: [MatchmakingController],
  providers: [
    { provide: LOBBY_REPOSITORY, useClass: LobbyRepository },
    { provide: TOPIC_REPOSITORY, useClass: TopicRepository },
    JoinAsPlayerUseCase,
    JoinAsRefereeUseCase,
    DesignateWinnerUseCase,
    CreateTopicUseCase,
    ListTopicsUseCase,
  ],
})
export class MatchmakingModule {}
