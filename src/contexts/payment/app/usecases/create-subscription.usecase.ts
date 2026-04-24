import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { SUBSCRIPTION_REPOSITORY, SubscriptionRepositoryPort } from '../ports/subscription.repository.port';
import { STRIPE_SERVICE, StripeServicePort } from '../ports/stripe.service.port';
import { SubscriptionStatus } from '../../domain/enums/subscription-status.enum';
import { PlanInterval } from '../../domain/enums/plan-interval.enum';

const TRIAL_DAYS = 14;

@Injectable()
export class CreateSubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptionRepo: SubscriptionRepositoryPort,
    @Inject(STRIPE_SERVICE) private readonly stripeService: StripeServicePort,
  ) {}

  async execute(userId: string, customerId: string, plan: PlanInterval, promoCode?: string) {
    const existing = await this.subscriptionRepo.findByUserId(userId);
    if (existing && existing.isActive()) {
      throw new BadRequestException('User already has an active subscription');
    }

    const priceIds: Record<PlanInterval, string> = {
      [PlanInterval.MONTHLY]: process.env.STRIPE_MONTHLY_PRICE_ID ?? '',
      [PlanInterval.YEARLY]: process.env.STRIPE_YEARLY_PRICE_ID ?? '',
    };
    const priceId = priceIds[plan];
    if (!priceId) {
      throw new BadRequestException(`No price configured for plan: ${plan}`);
    }

    const { subscriptionId, clientSecret, status } = await this.stripeService.createSubscription({
      customerId,
      priceId,
      trialDays: TRIAL_DAYS,
      promoCode,
    });

    const subscription = await this.subscriptionRepo.save({
      userId,
      planInterval: plan,
      status: status === 'trialing' ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      cancelAtPeriodEnd: false,
    } as any);

    return { subscriptionId: subscription.id, clientSecret, status };
  }
}
