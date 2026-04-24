import { SubscriptionModel } from './subscription.model';
import { SubscriptionStatus } from './enums/subscription-status.enum';
import { PlanInterval } from './enums/plan-interval.enum';

describe('SubscriptionModel', () => {
  const makeSub = (status: SubscriptionStatus = SubscriptionStatus.ACTIVE) =>
    new SubscriptionModel('s1', 'u1', PlanInterval.MONTHLY, status, 'sub_x', 'cus_x', null, null, null, false, new Date());

  it('isActive retourne true pour ACTIVE', () => {
    expect(makeSub(SubscriptionStatus.ACTIVE).isActive()).toBe(true);
  });

  it('isActive retourne true pour TRIALING', () => {
    expect(makeSub(SubscriptionStatus.TRIALING).isActive()).toBe(true);
  });

  it('isActive retourne false pour CANCELED', () => {
    expect(makeSub(SubscriptionStatus.CANCELED).isActive()).toBe(false);
  });

  it('cancel met cancelAtPeriodEnd à true', () => {
    const sub = makeSub();
    sub.cancel();
    expect(sub.cancelAtPeriodEnd).toBe(true);
  });

  it('changePlan met à jour planInterval', () => {
    const sub = makeSub();
    sub.changePlan(PlanInterval.YEARLY);
    expect(sub.planInterval).toBe(PlanInterval.YEARLY);
  });

  it('markCanceled met le status à CANCELED', () => {
    const sub = makeSub();
    sub.markCanceled();
    expect(sub.status).toBe(SubscriptionStatus.CANCELED);
  });
});
