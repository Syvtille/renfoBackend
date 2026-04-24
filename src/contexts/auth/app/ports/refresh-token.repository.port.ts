import { RefreshTokenEntity } from '../../infra/entities/refresh-token.entity';
import { CreateRefreshTokenInput } from '../types/refresh-token.repository.types';

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export abstract class RefreshTokenRepositoryPort {
  abstract create(input: CreateRefreshTokenInput): RefreshTokenEntity;
  abstract save(entity: RefreshTokenEntity): Promise<RefreshTokenEntity>;
  abstract findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null>;
  abstract revoke(id: string): Promise<void>;
  abstract revokeAllForUser(userId: string): Promise<void>;
  abstract revokeByFamilyId(familyId: string): Promise<void>;
}
