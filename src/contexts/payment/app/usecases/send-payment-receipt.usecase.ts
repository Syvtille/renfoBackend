import { Inject, Injectable, Logger } from '@nestjs/common';
import { EMAIL_SERVICE, EmailServicePort } from '../ports/email.service.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { PaymentModel } from '../../domain/payment.model';

@Injectable()
export class SendPaymentReceiptUseCase {
  private readonly logger = new Logger(SendPaymentReceiptUseCase.name);

  constructor(
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailServicePort,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: ProductRepositoryPort,
  ) {}

  async execute(payment: PaymentModel): Promise<void> {
    if (!payment.billingAddress) {
      this.logger.warn(`Payment ${payment.id} has no billing address — skipping receipt email`);
      return;
    }

    const product = await this.productRepo.findById(payment.productId);

    await this.emailService.sendPaymentReceipt({
      to: payment.billingAddress.email,
      productName: product?.name ?? 'Produit ClashChat',
      amountInCents: payment.amountInCents,
      currency: payment.currency,
      transactionId: payment.stripePaymentIntentId ?? payment.id,
      billingAddress: payment.billingAddress,
      paymentDate: payment.createdAt,
    });
  }
}
