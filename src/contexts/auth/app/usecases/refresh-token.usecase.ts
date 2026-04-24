import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { signCustomJwt } from '../../../../shared/jwt/jwt.utils';
import { JWT_SECRET, JWT_ACCESS_EXPIRES_IN } from '../../../../shared/jwt/jwt.constants';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepositoryPort } from '../ports/refresh-token.repository.port';
import { USER_REPOSITORY, UserRepositoryPort } from '../ports/user.repository.port';
import { AsyncMutex } from '../../../../shared/mutex/async-mutex';
import { LOCK, LockPort } from '../../../../core/lock/lock.port';
import { DeviceContext, SecurityScoringService } from '../services/security-scoring.service';
import {
  AuthTokenInvalidError,
  AuthTokenCompromisedError,
  AuthTokenExpiredError,
  AuthInvalidCredentialsError,
  AuthSessionInvalidatedError,
  AuthSuspiciousActivityError,
} from '../../domain/errors/auth.errors';

@Injectable()
export class RefreshTokenUseCase {
  private readonly mutexes = new Map<string, AsyncMutex>();

  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly rtRepo: RefreshTokenRepositoryPort,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
    private readonly scoring: SecurityScoringService,
    @Inject(LOCK) private readonly lock: LockPort,
  ) {}

  async execute(
    rawToken: string,
    deviceContext: DeviceContext = { userAgent: null, deviceId: null, ip: null },
  ): Promise<{ accessToken: string; refreshToken: string; securityAlert?: string }> {
    const tokenHash = this.hashToken(rawToken);

    if (!this.mutexes.has(tokenHash)) {
      this.mutexes.set(tokenHash, new AsyncMutex());
    }
    const mutex = this.mutexes.get(tokenHash)!;
    const release = await mutex.acquire();

    // Cross-process lock — protects against a replayed refresh token concurrently hitting
    // two app instances. The in-process mutex above handles same-instance concurrency cheaply.
    const distributedLock = await this.lock.acquire(`refresh:${tokenHash}`, { ttlMs: 5_000, waitMs: 3_000 });

    try {
      if (!distributedLock) throw new AuthTokenInvalidError();

      const record = await this.rtRepo.findByTokenHash(tokenHash);
      if (!record) throw new AuthTokenInvalidError();

      if (record.revokedAt) {
        await this.rtRepo.revokeByFamilyId(record.familyId);
        throw new AuthTokenCompromisedError();
      }

      if (record.expiresAt < new Date()) throw new AuthTokenExpiredError();

      const user = await this.userRepo.findById(record.userId);
      if (!user || !user.isActive) throw new AuthInvalidCredentialsError();

      if (record.tokenVersion !== user.tokenVersion) throw new AuthSessionInvalidatedError();

      const storedContext: DeviceContext = {
        userAgent: record.userAgent,
        deviceId: record.deviceId,
        ip: record.ipAddress,
      };
      const scoringResult = this.scoring.evaluate(user.id, deviceContext, storedContext);

      if (scoringResult.level === 'block') {
        await this.rtRepo.revokeByFamilyId(record.familyId);
        throw new AuthSuspiciousActivityError(scoringResult.message ?? undefined);
      }

      await this.rtRepo.revoke(record.id);

      const newRawToken = this.generateToken();
      const newHash = this.hashToken(newRawToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const newToken = this.rtRepo.create({
        userId: user.id,
        tokenHash: newHash,
        expiresAt,
        familyId: record.familyId,
        parentId: record.id,
        userAgent: deviceContext.userAgent,
        deviceId: deviceContext.deviceId,
        ipAddress: deviceContext.ip,
        tokenVersion: user.tokenVersion,
      });
      await this.rtRepo.save(newToken);

      const payload = {
        sub: user.id,
        username: user.username,
        permissions: user.permissions,
        version: user.tokenVersion,
      };
      const accessToken = signCustomJwt(payload, JWT_SECRET, JWT_ACCESS_EXPIRES_IN);

      return {
        accessToken,
        refreshToken: newRawToken,
        ...(scoringResult.message ? { securityAlert: scoringResult.message } : {}),
      };
    } finally {
      if (distributedLock) await distributedLock.release();
      release();
      if (mutex.isIdle) this.mutexes.delete(tokenHash);
    }
  }

  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
