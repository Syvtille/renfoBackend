import { BillingAddress } from '../../domain/payment.model.js';

export interface PaymentReceiptData {
  to: string;
  productName: string;
  amountInCents: number;
  currency: string;
  transactionId: string;
  billingAddress: BillingAddress;
  paymentDate: Date;
}

/**
 * Port abstrait pour le service email — découple l'application de l'infra email.
 */
export abstract class EmailServicePort {
  abstract sendPaymentReceipt(data: PaymentReceiptData): Promise<void>;
}

export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');
