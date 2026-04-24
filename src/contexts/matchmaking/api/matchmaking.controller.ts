import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/jwt/jwt-auth.guard';
import { JoinAsPlayerUseCase } from '../app/usecases/join-as-player.usecase';
import { JoinAsRefereeUseCase } from '../app/usecases/join-as-referee.usecase';
import { DesignateWinnerUseCase } from '../app/usecases/designate-winner.usecase';
import { CreateTopicUseCase } from '../app/usecases/create-topic.usecase';
import { ListTopicsUseCase } from '../app/usecases/list-topics.usecase';
import { ChatGateway } from '../../chat/api/chat.gateway';
import { PermissionsGuard } from '../../../shared/permissions/permissions.guard';
import { RequirePermissions } from '../../../shared/permissions/require-permissions.decorator';
import {
  JOIN_AS_PLAYER,
  JOIN_AS_REFEREE,
  DESIGNATE_WINNER,
  MANAGE_TOPICS,
} from '../../../shared/permissions/permission.constants';
import { IsString, MinLength } from 'class-validator';

class CreateTopicDto {
  @IsString()
  @MinLength(5)
  content: string;
}

class DesignateWinnerDto {
  @IsString()
  lobbyId: string;

  @IsString()
  winnerId: string;
}

@Controller('matchmaking')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MatchmakingController {
  constructor(
    private readonly joinAsPlayer: JoinAsPlayerUseCase,
    private readonly joinAsReferee: JoinAsRefereeUseCase,
    private readonly designateWinner: DesignateWinnerUseCase,
    private readonly createTopic: CreateTopicUseCase,
    private readonly listTopics: ListTopicsUseCase,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post('join/player')
  @RequirePermissions(JOIN_AS_PLAYER)
  joinPlayer(@Request() req: any) {
    return this.joinAsPlayer.execute(req.user.userId);
  }

  @Post('join/referee')
  @RequirePermissions(JOIN_AS_REFEREE)
  async joinReferee(@Request() req: any) {
    const result = await this.joinAsReferee.execute(req.user.userId);
    this.chatGateway.server.to(result.lobby.id).emit('lobbyReady', result.lobby);
    return result;
  }

  @Post('winner')
  @RequirePermissions(DESIGNATE_WINNER)
  async setWinner(@Request() req: any, @Body() dto: DesignateWinnerDto) {
    const lobby = await this.designateWinner.execute(dto.lobbyId, req.user.userId, dto.winnerId);
    this.chatGateway.server.to(dto.lobbyId).emit('gameOver', lobby);
    return lobby;
  }

  /** Content Manager — rédiger un sujet de débat */
  @Post('topics')
  @RequirePermissions(MANAGE_TOPICS)
  addTopic(@Request() req: any, @Body() dto: CreateTopicDto) {
    return this.createTopic.execute(dto.content, req.user.userId);
  }

  /** Tous les connectés — lister les sujets disponibles */
  @Get('topics')
  getTopics() {
    return this.listTopics.execute();
  }
}
