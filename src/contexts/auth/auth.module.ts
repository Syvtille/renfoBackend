import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './infra/entities/user.entity';
import { RefreshTokenEntity } from './infra/entities/refresh-token.entity';
import { UserRepository } from './infra/user.repository';
import { RefreshTokenRepository } from './infra/refresh-token.repository';
import { USER_REPOSITORY } from './app/ports/user.repository.port';
import { REFRESH_TOKEN_REPOSITORY } from './app/ports/refresh-token.repository.port';
import { RegisterUseCase } from './app/usecases/register.usecase';
import { LoginUseCase } from './app/usecases/login.usecase';
import { UpdateStatsUseCase } from './app/usecases/update-stats.usecase';
import { GetStatsUseCase } from './app/usecases/get-stats.usecase';
import { ToggleUserActiveUseCase } from './app/usecases/toggle-user-active.usecase';
import { ListUsersUseCase } from './app/usecases/list-users.usecase';
import { RefreshTokenUseCase } from './app/usecases/refresh-token.usecase';
import { LogoutUseCase } from './app/usecases/logout.usecase';
import { InvalidateTokensUseCase } from './app/usecases/invalidate-tokens.usecase';
import { SendWelcomeEmailUseCase } from './app/usecases/send-welcome-email.usecase';
import { SecurityScoringService } from './app/services/security-scoring.service';
import { AuthController } from './api/auth.controller';
import { JwtAuthGuard } from '../../shared/jwt/jwt-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity])],
  controllers: [AuthController],
  providers: [
    { provide: USER_REPOSITORY, useClass: UserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: RefreshTokenRepository },
    RegisterUseCase,
    LoginUseCase,
    UpdateStatsUseCase,
    GetStatsUseCase,
    ToggleUserActiveUseCase,
    ListUsersUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    InvalidateTokensUseCase,
    SendWelcomeEmailUseCase,
    SecurityScoringService,
    JwtAuthGuard,
  ],
  exports: [UpdateStatsUseCase, JwtAuthGuard],
})
export class AuthModule {}
