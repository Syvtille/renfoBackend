import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { PAYMENT_REPOSITORY, PaymentRepositoryPort } from '../ports/payment.repository.port';
import { STRIPE_SERVICE, StripeServicePort } from '../ports/stripe.service.port';
import { BillingAddress } from '../../domain/payment.model';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';

@Injectable()
export class PurchaseProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: ProductRepositoryPort,
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: PaymentRepositoryPort,
    @Inject(STRIPE_SERVICE) private readonly stripeService: StripeServicePort,
  ) {}

  async execute(userId: string, productId: string, stripeCustomerId: string, billing: BillingAddress) {
    const product = await this.productRepo.findById(productId);
    if (!product || !product.isAvailable()) {
      throw new NotFoundException('Product not found or unavailable');
    }

    const { paymentIntentId, clientSecret } = await this.stripeService.createPaymentIntent({
      amountInCents: product.priceInCents,
      currency: product.currency,
      customerId: stripeCustomerId,
      metadata: { userId, productId },
      billingDetails: billing,
    });

    const payment = await this.paymentRepo.save({
      userId,
      productId,
      amountInCents: product.priceInCents,
      currency: product.currency,
      status: PaymentStatus.PENDING,
      stripePaymentIntentId: paymentIntentId,
      billingAddress: billing,
    } as any);

    return { paymentId: payment.id, clientSecret };
  }
}
