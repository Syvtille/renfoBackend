import { SubscriptionModel } from '../../domain/subscription.model.js';

export abstract class SubscriptionRepositoryPort {
  abstract findById(id: string): Promise<SubscriptionModel | null>;
  abstract findByUserId(userId: string): Promise<SubscriptionModel | null>;
  abstract findByStripeSubscriptionId(stripeSubId: string): Promise<SubscriptionModel | null>;
  abstract findByStripeCustomerId(customerId: string): Promise<SubscriptionModel | null>;
  abstract save(subscription: Partial<SubscriptionModel>): Promise<SubscriptionModel>;
  abstract update(id: string, data: Partial<SubscriptionModel>): Promise<SubscriptionModel>;
}

export const SUBSCRIPTION_REPOSITORY = Symbol('SUBSCRIPTION_REPOSITORY');
