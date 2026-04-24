import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { RegisterUseCase } from '../app/usecases/register.usecase';
import { LoginUseCase } from '../app/usecases/login.usecase';
import { SendWelcomeEmailUseCase } from '../app/usecases/send-welcome-email.usecase';
import { GetStatsUseCase } from '../app/usecases/get-stats.usecase';
import { ToggleUserActiveUseCase } from '../app/usecases/toggle-user-active.usecase';
import { ListUsersUseCase } from '../app/usecases/list-users.usecase';
import { RefreshTokenUseCase } from '../app/usecases/refresh-token.usecase';
import { LogoutUseCase } from '../app/usecases/logout.usecase';
import { InvalidateTokensUseCase } from '../app/usecases/invalidate-tokens.usecase';
import { RegisterDto, LoginDto, RefreshTokenDto, LogoutDto } from './dto/auth.dto';
import { PermissionsGuard } from '../../../shared/permissions/permissions.guard';
import { RequirePermissions } from '../../../shared/permissions/require-permissions.decorator';
import { MANAGE_USERS } from '../../../shared/permissions/permission.constants';
import { JwtAuthGuard } from '../../../shared/jwt/jwt-auth.guard';
import { SecurityScoringService } from '../app/services/security-scoring.service';
import { toUserPublic, toUserStats, TokensPresenter } from './presenters/auth.presenter';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getStatsUseCase: GetStatsUseCase,
    private readonly toggleUserActive: ToggleUserActiveUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly invalidateTokensUseCase: InvalidateTokensUseCase,
    private readonly scoringService: SecurityScoringService,
    private readonly sendWelcomeEmail: SendWelcomeEmailUseCase,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.registerUseCase.execute(dto.email, dto.username, dto.password, dto.role);
    // Fire-and-forget — SMTP must not block the HTTP response.
    void this.sendWelcomeEmail.execute(user.email, user.username);
    return toUserPublic(user);
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request): Promise<TokensPresenter> {
    return this.loginUseCase.execute(dto.email, dto.password, this.extractDeviceContext(req));
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: any) {
    return req.user;
  }

  @Get('users/:id/stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@Param('id') id: string) {
    const user = await this.getStatsUseCase.execute(id);
    return toUserStats(user);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(MANAGE_USERS)
  async getAllUsers() {
    const users = await this.listUsers.execute();
    return users.map(toUserPublic);
  }

  @Patch('users/:id/toggle-active')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(MANAGE_USERS)
  async toggleActive(@Param('id') id: string) {
    const user = await this.toggleUserActive.execute(id);
    return toUserPublic(user);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request): Promise<TokensPresenter> {
    return this.refreshTokenUseCase.execute(dto.refreshToken, this.extractDeviceContext(req));
  }

  @Post('logout')
  async logout(@Body() dto: LogoutDto): Promise<void> {
    await this.logoutUseCase.execute(dto.refreshToken);
  }

  @Post('invalidate-tokens')
  @UseGuards(JwtAuthGuard)
  async invalidateTokens(@Req() req: any): Promise<{ message: string }> {
    await this.invalidateTokensUseCase.execute(req.user.userId);
    return { message: 'Tous les refresh tokens ont été invalidés' };
  }

  @Get('security/logs')
  @UseGuards(JwtAuthGuard)
  getSecurityLogs(@Req() req: any) {
    return this.scoringService.getLogsForUser(req.user.userId);
  }

  private extractDeviceContext(req: Request) {
    return {
      userAgent: (req.headers['user-agent'] as string) || null,
      deviceId: (req.headers['x-device-id'] as string) || null,
      ip: (req.headers['x-forwarded-for'] as string) || req.ip || null,
    };
  }
}
