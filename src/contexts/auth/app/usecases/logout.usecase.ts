import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepositoryPort } from '../ports/refresh-token.repository.port';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly rtRepo: RefreshTokenRepositoryPort,
  ) {}

  async execute(rawToken: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = await this.rtRepo.findByTokenHash(tokenHash);

    if (!record || record.revokedAt) return;

    await this.rtRepo.revoke(record.id);
  }
}
