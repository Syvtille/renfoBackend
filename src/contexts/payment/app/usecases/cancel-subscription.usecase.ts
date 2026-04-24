import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SUBSCRIPTION_REPOSITORY, SubscriptionRepositoryPort } from '../ports/subscription.repository.port';
import { STRIPE_SERVICE, StripeServicePort } from '../ports/stripe.service.port';

@Injectable()
export class CancelSubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptionRepo: SubscriptionRepositoryPort,
    @Inject(STRIPE_SERVICE) private readonly stripeService: StripeServicePort,
  ) {}

  async execute(userId: string) {
    const subscription = await this.subscriptionRepo.findByUserId(userId);
    if (!subscription || !subscription.isActive()) {
      throw new NotFoundException('No active subscription found');
    }

    await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId!);

    subscription.cancel();
    await this.subscriptionRepo.update(subscription.id, {
      cancelAtPeriodEnd: true,
    } as any);

    return { message: 'Subscription will be canceled at end of current period' };
  }
}
