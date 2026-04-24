import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SUBSCRIPTION_REPOSITORY, SubscriptionRepositoryPort } from '../ports/subscription.repository.port';
import { STRIPE_SERVICE, StripeServicePort } from '../ports/stripe.service.port';
import { PlanInterval } from '../../domain/enums/plan-interval.enum';

@Injectable()
export class ChangePlanUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptionRepo: SubscriptionRepositoryPort,
    @Inject(STRIPE_SERVICE) private readonly stripeService: StripeServicePort,
  ) {}

  async execute(userId: string, newPlan: PlanInterval) {
    const subscription = await this.subscriptionRepo.findByUserId(userId);
    if (!subscription || !subscription.isActive()) {
      throw new NotFoundException('No active subscription found');
    }

    if (subscription.planInterval === newPlan) {
      throw new BadRequestException('Already on this plan');
    }

    const priceIds: Record<PlanInterval, string> = {
      [PlanInterval.MONTHLY]: process.env.STRIPE_MONTHLY_PRICE_ID ?? '',
      [PlanInterval.YEARLY]: process.env.STRIPE_YEARLY_PRICE_ID ?? '',
    };
    const newPriceId = priceIds[newPlan];
    if (!newPriceId) {
      throw new BadRequestException(`No price configured for plan: ${newPlan}`);
    }

    await this.stripeService.changeSubscriptionPlan(subscription.stripeSubscriptionId!, newPriceId);

    subscription.changePlan(newPlan);
    await this.subscriptionRepo.update(subscription.id, {
      planInterval: newPlan,
      cancelAtPeriodEnd: false,
    } as any);

    return { message: `Plan changed to ${newPlan}` };
  }
}
