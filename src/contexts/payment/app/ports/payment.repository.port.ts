import { PaymentModel } from '../../domain/payment.model.js';

export abstract class PaymentRepositoryPort {
  abstract findById(id: string): Promise<PaymentModel | null>;
  abstract findByUserId(userId: string): Promise<PaymentModel[]>;
  abstract findByStripePaymentIntentId(intentId: string): Promise<PaymentModel | null>;
  abstract save(payment: Partial<PaymentModel>): Promise<PaymentModel>;
  abstract update(id: string, data: Partial<PaymentModel>): Promise<PaymentModel>;
}

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');
