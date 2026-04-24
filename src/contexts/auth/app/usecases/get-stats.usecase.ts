import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../ports/user.repository.port';
import { UserEntity } from '../../infra/entities/user.entity';
import { AuthUserNotFoundError } from '../../domain/errors/auth.errors';

@Injectable()
export class GetStatsUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
  ) {}

  async execute(userId: string): Promise<UserEntity> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new AuthUserNotFoundError();
    return user;
  }
}
