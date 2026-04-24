import { SubscriptionStatus } from './enums/subscription-status.enum.js';
import { PlanInterval } from './enums/plan-interval.enum.js';

/**
 * Modèle de domaine Subscription — représente un abonnement utilisateur.
 */
export class SubscriptionModel {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public planInterval: PlanInterval,
    public status: SubscriptionStatus,
    public readonly stripeSubscriptionId: string | null,
    public readonly stripeCustomerId: string,
    public currentPeriodStart: Date | null,
    public currentPeriodEnd: Date | null,
    public trialEnd: Date | null,
    public cancelAtPeriodEnd: boolean,
    public readonly createdAt: Date,
  ) {}

  isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE || this.status === SubscriptionStatus.TRIALING;
  }

  isTrialing(): boolean {
    return this.status === SubscriptionStatus.TRIALING;
  }

  cancel(): void {
    this.cancelAtPeriodEnd = true;
  }

  markCanceled(): void {
    this.status = SubscriptionStatus.CANCELED;
  }

  changePlan(newInterval: PlanInterval): void {
    this.planInterval = newInterval;
  }

  updatePeriod(start: Date, end: Date): void {
    this.currentPeriodStart = start;
    this.currentPeriodEnd = end;
  }

  updateStatus(status: SubscriptionStatus): void {
    this.status = status;
  }
}
