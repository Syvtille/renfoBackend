import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { RefreshTokenRepositoryPort } from '../app/ports/refresh-token.repository.port';
import { CreateRefreshTokenInput } from '../app/types/refresh-token.repository.types';

@Injectable()
export class RefreshTokenRepository implements RefreshTokenRepositoryPort {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly repo: Repository<RefreshTokenEntity>,
  ) {}

  create(input: CreateRefreshTokenInput): RefreshTokenEntity {
    return this.repo.create({
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      familyId: input.familyId,
      parentId: input.parentId ?? null,
      userAgent: input.userAgent ?? null,
      deviceId: input.deviceId ?? null,
      ipAddress: input.ipAddress ?? null,
      tokenVersion: input.tokenVersion ?? 0,
      revokedAt: null,
    });
  }

  async save(entity: RefreshTokenEntity): Promise<RefreshTokenEntity> {
    return this.repo.save(entity);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null> {
    return this.repo.findOne({ where: { tokenHash } });
  }

  async revoke(id: string): Promise<void> {
    await this.repo.update(id, { revokedAt: new Date() });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.repo.createQueryBuilder()
      .update()
      .set({ revokedAt: new Date() })
      .where('userId = :userId AND revokedAt IS NULL', { userId })
      .execute();
  }

  async revokeByFamilyId(familyId: string): Promise<void> {
    await this.repo.createQueryBuilder()
      .update()
      .set({ revokedAt: new Date() })
      .where('familyId = :familyId AND revokedAt IS NULL', { familyId })
      .execute();
  }
}
