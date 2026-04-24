import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../ports/user.repository.port';

@Injectable()
export class UpdateStatsUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
  ) {}

  async execute(winnerId: string, loserId: string): Promise<void> {
    await this.userRepo.atomicIncrementStats(winnerId, loserId);
  }
}
