import { Inject, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';
import { USER_REPOSITORY, UserRepositoryPort } from '../ports/user.repository.port';
import { UserEntity } from '../../infra/entities/user.entity';
import { AuthEmailAlreadyTakenError, AuthUsernameAlreadyTakenError } from '../../domain/errors/auth.errors';
import {
  ROLE_PLAYER, ROLE_REFEREE, ROLE_SUPPORT, ROLE_CONTENT_MANAGER, ROLE_ADMIN,
} from '../../../../shared/permissions/permission.constants';
import { BLOOM_FILTER, BloomFilterPort } from '../../../../core/bloom/bloom-filter.port';

type Role = 'player' | 'referee' | 'support' | 'content_manager' | 'admin';

const ROLE_MAP: Record<Role, bigint> = {
  player: ROLE_PLAYER,
  referee: ROLE_REFEREE,
  support: ROLE_SUPPORT,
  content_manager: ROLE_CONTENT_MANAGER,
  admin: ROLE_ADMIN,
};

export const BLOOM_NS_EMAIL = 'user:email';
export const BLOOM_NS_USERNAME = 'user:username';

@Injectable()
export class RegisterUseCase {
  private readonly logger = new Logger(RegisterUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
    @Inject(BLOOM_FILTER) private readonly bloom: BloomFilterPort,
  ) {}

  async execute(email: string, username: string, password: string, role: Role): Promise<UserEntity> {
    // Cheap path: bloom filter absence guarantees "definitely not in DB" → skip the full SELECT.
    const [maybeEmail, maybeUsername] = await Promise.all([
      this.bloom.mightExist(BLOOM_NS_EMAIL, email),
      this.bloom.mightExist(BLOOM_NS_USERNAME, username),
    ]);

    if (maybeEmail || maybeUsername) {
      const [byEmail, byUsername] = await Promise.all([
        maybeEmail ? this.userRepo.findByEmail(email) : Promise.resolve(null),
        maybeUsername ? this.userRepo.findByUsername(username) : Promise.resolve(null),
      ]);
      if (byEmail) throw new AuthEmailAlreadyTakenError();
      if (byUsername) throw new AuthUsernameAlreadyTakenError();
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const permissions = (ROLE_MAP[role] ?? ROLE_PLAYER).toString();

    const user = this.userRepo.create({ email, username, passwordHash, permissions });

    try {
      const saved = await this.userRepo.save(user);
      // Update bloom only after successful commit. Never delete from bloom (Bloom filters don't support removal).
      await Promise.all([
        this.bloom.add(BLOOM_NS_EMAIL, saved.email),
        this.bloom.add(BLOOM_NS_USERNAME, saved.username),
      ]);
      return saved;
    } catch (err) {
      // UNIQUE constraint is the final line of defense (covers bloom false-negatives under concurrent registration).
      if (err instanceof QueryFailedError && (err as any).code === '23505') {
        const detail: string = (err as any).detail ?? '';
        if (detail.includes('email')) {
          await this.bloom.add(BLOOM_NS_EMAIL, email);
          throw new AuthEmailAlreadyTakenError();
        }
        if (detail.includes('username')) {
          await this.bloom.add(BLOOM_NS_USERNAME, username);
          throw new AuthUsernameAlreadyTakenError();
        }
        throw new AuthEmailAlreadyTakenError();
      }
      throw err;
    }
  }
}
