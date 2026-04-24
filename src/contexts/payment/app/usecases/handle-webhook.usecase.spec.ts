import { HandleWebhookUseCase } from './handle-webhook.usecase';
import { SendPaymentReceiptUseCase } from './send-payment-receipt.usecase';
import { PaymentRepositoryPort } from '../ports/payment.repository.port';
import { SubscriptionRepositoryPort } from '../ports/subscription.repository.port';
import { StripeServicePort } from '../ports/stripe.service.port';
import { PaymentModel } from '../../domain/payment.model';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { SubscriptionModel } from '../../domain/subscription.model';
import { SubscriptionStatus } from '../../domain/enums/subscription-status.enum';
import { PlanInterval } from '../../domain/enums/plan-interval.enum';

describe('HandleWebhookUseCase', () => {
  let useCase: HandleWebhookUseCase;
  let mockPaymentRepo: jest.Mocked<PaymentRepositoryPort>;
  let mockSubRepo: jest.Mocked<SubscriptionRepositoryPort>;
  let mockStripe: jest.Mocked<StripeServicePort>;
  let mockSendReceipt: jest.Mocked<SendPaymentReceiptUseCase>;

  beforeEach(() => {
    mockPaymentRepo = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByStripePaymentIntentId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as jest.Mocked<PaymentRepositoryPort>;

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

    mockSendReceipt = { execute: jest.fn().mockResolvedValue(undefined) } as any;

    useCase = new HandleWebhookUseCase(mockPaymentRepo, mockSubRepo, mockStripe, mockSendReceipt);
  });

  it('marque le paiement succeeded sur payment_intent.succeeded', async () => {
    const payment = new PaymentModel('pay1', 'u1', 'p1', 999, 'eur', PaymentStatus.PENDING, 'pi_123', null, new Date());
    mockStripe.constructWebhookEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123' } },
    });
    mockPaymentRepo.findByStripePaymentIntentId.mockResolvedValue(payment);
    mockPaymentRepo.update.mockResolvedValue(payment);

    const result = await useCase.execute(Buffer.from('{}'), 'sig');

    expect(mockPaymentRepo.update).toHaveBeenCalledWith('pay1', { status: PaymentStatus.SUCCEEDED });
    expect(result.received).toBe(true);
  });

  it('marque le paiement failed sur payment_intent.payment_failed', async () => {
    const payment = new PaymentModel('pay1', 'u1', 'p1', 999, 'eur', PaymentStatus.PENDING, 'pi_456', null, new Date());
    mockStripe.constructWebhookEvent.mockReturnValue({
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_456' } },
    });
    mockPaymentRepo.findByStripePaymentIntentId.mockResolvedValue(payment);
    mockPaymentRepo.update.mockResolvedValue(payment);

    await useCase.execute(Buffer.from('{}'), 'sig');

    expect(mockPaymentRepo.update).toHaveBeenCalledWith('pay1', { status: PaymentStatus.FAILED });
  });

  it('met à jour le status de la subscription sur customer.subscription.updated', async () => {
    const sub = new SubscriptionModel(
      'sub1', 'u1', PlanInterval.MONTHLY, SubscriptionStatus.TRIALING,
      'sub_stripe', 'cus_1', null, null, null, false, new Date(),
    );
    mockStripe.constructWebhookEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_stripe',
          status: 'active',
          cancel_at_period_end: false,
          current_period_start: 1700000000,
          current_period_end: 1702600000,
        },
      },
    });
    mockSubRepo.findByStripeSubscriptionId.mockResolvedValue(sub);
    mockSubRepo.update.mockResolvedValue(sub);

    await useCase.execute(Buffer.from('{}'), 'sig');

    expect(mockSubRepo.update).toHaveBeenCalledWith('sub1', expect.objectContaining({
      status: SubscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: false,
    }));
  });

  it('annule la subscription sur customer.subscription.deleted', async () => {
    const sub = new SubscriptionModel(
      'sub1', 'u1', PlanInterval.MONTHLY, SubscriptionStatus.ACTIVE,
      'sub_stripe', 'cus_1', null, null, null, false, new Date(),
    );
    mockStripe.constructWebhookEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_stripe' } },
    });
    mockSubRepo.findByStripeSubscriptionId.mockResolvedValue(sub);
    mockSubRepo.update.mockResolvedValue(sub);

    await useCase.execute(Buffer.from('{}'), 'sig');

    expect(mockSubRepo.update).toHaveBeenCalledWith('sub1', { status: SubscriptionStatus.CANCELED });
  });
});
