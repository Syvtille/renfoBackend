import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChangePlanUseCase } from './change-plan.usecase';
import { SubscriptionRepositoryPort } from '../ports/subscription.repository.port';
import { StripeServicePort } from '../ports/stripe.service.port';
import { SubscriptionModel } from '../../domain/subscription.model';
import { SubscriptionStatus } from '../../domain/enums/subscription-status.enum';
import { PlanInterval } from '../../domain/enums/plan-interval.enum';

describe('ChangePlanUseCase', () => {
  let useCase: ChangePlanUseCase;
  let mockSubRepo: jest.Mocked<SubscriptionRepositoryPort>;
  let mockStripe: jest.Mocked<StripeServicePort>;

  beforeEach(() => {
    process.env.STRIPE_MONTHLY_PRICE_ID = 'price_monthly';
    process.env.STRIPE_YEARLY_PRICE_ID = 'price_yearly';

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

    useCase = new ChangePlanUseCase(mockSubRepo, mockStripe);
  });

  it('lève NotFoundException sans abonnement actif', async () => {
    mockSubRepo.findByUserId.mockResolvedValue(null);
    await expect(useCase.execute('user1', PlanInterval.YEARLY)).rejects.toThrow(NotFoundException);
  });

  it('lève BadRequestException si déjà sur le même plan', async () => {
    const sub = new SubscriptionModel(
      'sub1', 'user1', PlanInterval.MONTHLY, SubscriptionStatus.ACTIVE,
      'sub_stripe_1', 'cus_1', new Date(), new Date(), null, false, new Date(),
    );
    mockSubRepo.findByUserId.mockResolvedValue(sub);
    await expect(useCase.execute('user1', PlanInterval.MONTHLY)).rejects.toThrow(BadRequestException);
  });
});
