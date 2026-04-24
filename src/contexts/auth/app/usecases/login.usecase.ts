import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { USER_REPOSITORY, UserRepositoryPort } from '../ports/user.repository.port';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepositoryPort } from '../ports/refresh-token.repository.port';
import { RefreshTokenUseCase } from './refresh-token.usecase';
import { signCustomJwt } from '../../../../shared/jwt/jwt.utils';
import { JWT_SECRET, JWT_ACCESS_EXPIRES_IN } from '../../../../shared/jwt/jwt.constants';
import { DeviceContext } from '../services/security-scoring.service';
import { AuthInvalidCredentialsError, AuthAccountDisabledError } from '../../domain/errors/auth.errors';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly rtRepo: RefreshTokenRepositoryPort,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  async execute(
    email: string,
    password: string,
    deviceContext: DeviceContext = { userAgent: null, deviceId: null, ip: null },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new AuthInvalidCredentialsError();

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AuthInvalidCredentialsError();

    if (!user.isActive) throw new AuthAccountDisabledError();

    const payload = {
      sub: user.id,
      username: user.username,
      permissions: user.permissions,
      version: user.tokenVersion,
    };
    const accessToken = signCustomJwt(payload, JWT_SECRET, JWT_ACCESS_EXPIRES_IN);

    const familyId = crypto.randomUUID();
    const rawRefreshToken = this.refreshTokenUseCase.generateToken();
    const tokenHash = this.refreshTokenUseCase.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const tokenEntity = this.rtRepo.create({
      userId: user.id,
      tokenHash,
      expiresAt,
      familyId,
      parentId: null,
      userAgent: deviceContext.userAgent,
      deviceId: deviceContext.deviceId,
      ipAddress: deviceContext.ip,
      tokenVersion: user.tokenVersion,
    });
    await this.rtRepo.save(tokenEntity);

    return { accessToken, refreshToken: rawRefreshToken };
  }
}
