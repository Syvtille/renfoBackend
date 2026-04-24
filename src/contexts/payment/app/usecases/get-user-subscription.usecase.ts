import { Inject, Injectable } from '@nestjs/common';
import { SUBSCRIPTION_REPOSITORY, SubscriptionRepositoryPort } from '../ports/subscription.repository.port';

@Injectable()
export class GetUserSubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptionRepo: SubscriptionRepositoryPort,
  ) {}

  async execute(userId: string) {
    return this.subscriptionRepo.findByUserId(userId);
  }
}
