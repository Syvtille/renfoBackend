import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SUBSCRIPTION_REPOSITORY, SubscriptionRepositoryPort } from '../ports/subscription.repository.port';
import { STRIPE_SERVICE, StripeServicePort } from '../ports/stripe.service.port';

@Injectable()
export class GetInvoicesUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptionRepo: SubscriptionRepositoryPort,
    @Inject(STRIPE_SERVICE) private readonly stripeService: StripeServicePort,
  ) {}

  async execute(userId: string) {
    const subscription = await this.subscriptionRepo.findByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('No subscription found');
    }

    return this.stripeService.getCustomerInvoices(subscription.stripeCustomerId);
  }
}
