import { PaymentStatus } from './enums/payment-status.enum.js';

export interface BillingAddress {
  name: string;
  email: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
}

/**
 * Modèle de domaine Payment — représente un paiement one-shot.
 */
export class PaymentModel {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly productId: string,
    public readonly amountInCents: number,
    public readonly currency: string,
    public status: PaymentStatus,
    public readonly stripePaymentIntentId: string | null,
    public readonly billingAddress: BillingAddress | null,
    public readonly createdAt: Date,
  ) {}

  markSucceeded(): void {
    this.status = PaymentStatus.SUCCEEDED;
  }

  markFailed(): void {
    this.status = PaymentStatus.FAILED;
  }

  markRefunded(): void {
    this.status = PaymentStatus.REFUNDED;
  }

  isCompleted(): boolean {
    return this.status === PaymentStatus.SUCCEEDED;
  }
}
