import { NotFoundException } from '@nestjs/common';
import { PurchaseProductUseCase } from './purchase-product.usecase';
import { ProductRepositoryPort } from '../ports/product.repository.port';
import { PaymentRepositoryPort } from '../ports/payment.repository.port';
import { StripeServicePort } from '../ports/stripe.service.port';
import { ProductModel } from '../../domain/product.model';
import { PaymentModel } from '../../domain/payment.model';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { BillingAddress } from '../../domain/payment.model';

describe('PurchaseProductUseCase', () => {
  let useCase: PurchaseProductUseCase;
  let mockProductRepo: jest.Mocked<ProductRepositoryPort>;
  let mockPaymentRepo: jest.Mocked<PaymentRepositoryPort>;
  let mockStripe: jest.Mocked<StripeServicePort>;

  const billing: BillingAddress = {
    name: 'John Doe', email: 'john@example.com',
    line1: '1 rue de Paris', city: 'Paris',
    postalCode: '75001', country: 'FR',
  };

  beforeEach(() => {
    mockProductRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      findByStripeProductId: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<ProductRepositoryPort>;

    mockPaymentRepo = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByStripePaymentIntentId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as jest.Mocked<PaymentRepositoryPort>;

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

    useCase = new PurchaseProductUseCase(mockProductRepo, mockPaymentRepo, mockStripe);
  });

  it('crée un PaymentIntent et enregistre le paiement', async () => {
    const product = new ProductModel('p1', 'Pack', 'desc', 999, 'eur', 'prod_x', 'price_x', true, new Date(), null, null, null, false);
    mockProductRepo.findById.mockResolvedValue(product);
    mockStripe.createPaymentIntent.mockResolvedValue({
      paymentIntentId: 'pi_123',
      clientSecret: 'cs_secret',
    });
    mockPaymentRepo.save.mockImplementation(async (p) =>
      new PaymentModel('pay1', (p as any).userId, (p as any).productId, (p as any).amountInCents, (p as any).currency, PaymentStatus.PENDING, 'pi_123', null, new Date()),
    );

    const result = await useCase.execute('user1', 'p1', 'cus_abc', billing);

    expect(mockStripe.createPaymentIntent).toHaveBeenCalledWith(expect.objectContaining({
      amountInCents: 999,
      currency: 'eur',
      customerId: 'cus_abc',
      metadata: { userId: 'user1', productId: 'p1' },
    }));
    expect(result.clientSecret).toBe('cs_secret');
    expect(result.paymentId).toBe('pay1');
  });

  it('lève NotFoundException si le produit n\'existe pas', async () => {
    mockProductRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('user1', 'bad-id', 'cus_abc', billing)).rejects.toThrow(NotFoundException);
  });

  it('lève NotFoundException si le produit n\'est pas disponible (pas de stripePriceId)', async () => {
    const product = new ProductModel('p2', 'Draft', 'desc', 999, 'eur', null, null, true, new Date(), null, null, null, false);
    mockProductRepo.findById.mockResolvedValue(product);
    await expect(useCase.execute('user1', 'p2', 'cus_abc', billing)).rejects.toThrow(NotFoundException);
  });
});
