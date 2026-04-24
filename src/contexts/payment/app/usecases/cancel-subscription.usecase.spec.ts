import { NotFoundException } from '@nestjs/common';
import { CancelSubscriptionUseCase } from './cancel-subscription.usecase';
import { SubscriptionRepositoryPort } from '../ports/subscription.repository.port';
import { StripeServicePort } from '../ports/stripe.service.port';
import { SubscriptionModel } from '../../domain/subscription.model';
import { SubscriptionStatus } from '../../domain/enums/subscription-status.enum';
import { PlanInterval } from '../../domain/enums/plan-interval.enum';

describe('CancelSubscriptionUseCase', () => {
  let useCase: CancelSubscriptionUseCase;
  let mockSubRepo: jest.Mocked<SubscriptionRepositoryPort>;
  let mockStripe: jest.Mocked<StripeServicePort>;

  beforeEach(() => {
    mockSubRepo = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByStripeSubscriptionId: jest.fn(),
      findByStripeCustomerId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as jest.Mocked<SubscriptionRepositoryPort>;

    mockStripe = {
      createCustomer: jest.fn(),
      createProduct: jest.fn(),
      createPaymentIntent: jest.fn(),
      createSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
      changeSubscriptionPlan: jest.fn(),
      getCustomerInvoices: jest.fn(),
      constructWebhookEvent: jest.fn(),
      listProductsWithPrices: jest.fn(),
    } as jest.Mocked<StripeServicePort>;

    useCase = new CancelSubscriptionUseCase(mockSubRepo, mockStripe);
  });

  it('annule un abonnement actif via Stripe et met à jour le repo', async () => {
    const sub = new SubscriptionModel(
      'sub1', 'user1', PlanInterval.MONTHLY, SubscriptionStatus.ACTIVE,
      'sub_stripe_1', 'cus_1', new Date(), new Date(), null, false, new Date(),
    );
    mockSubRepo.findByUserId.mockResolvedValue(sub);
    mockStripe.cancelSubscription.mockResolvedValue(undefined);
    mockSubRepo.update.mockResolvedValue(sub);

    const result = await useCase.execute('user1');

    expect(mockStripe.cancelSubscription).toHaveBeenCalledWith('sub_stripe_1');
    expect(mockSubRepo.update).toHaveBeenCalledWith('sub1', { cancelAtPeriodEnd: true });
    expect(result.message).toContain('canceled');
  });

  it('lève NotFoundException si aucun abonnement actif', async () => {
    mockSubRepo.findByUserId.mockResolvedValue(null);
    await expect(useCase.execute('user1')).rejects.toThrow(NotFoundException);
  });

  it('lève NotFoundException si l\'abonnement est déjà annulé', async () => {
    const sub = new SubscriptionModel(
      'sub1', 'user1', PlanInterval.MONTHLY, SubscriptionStatus.CANCELED,
      'sub_stripe_1', 'cus_1', new Date(), new Date(), null, true, new Date(),
    );
    mockSubRepo.findByUserId.mockResolvedValue(sub);
    await expect(useCase.execute('user1')).rejects.toThrow(NotFoundException);
  });
});
