import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../ports/user.repository.port';
import { UserEntity } from '../../infra/entities/user.entity';
import { AuthUserNotFoundError } from '../../domain/errors/auth.errors';

@Injectable()
export class ToggleUserActiveUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
  ) {}

  async execute(targetId: string): Promise<UserEntity> {
    const user = await this.userRepo.findById(targetId);
    if (!user) throw new AuthUserNotFoundError();

    user.isActive = !user.isActive;
    return this.userRepo.save(user);
  }
}
