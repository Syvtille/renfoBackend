import { BillingAddress } from '../../domain/payment.model.js';

export interface CreateProductParams {
  name: string;
  description: string;
  priceInCents: number;
  currency: string;
}

export interface CreateProductResult {
  stripeProductId: string;
  stripePriceId: string;
}

export interface StripeProductWithPrice {
  stripeProductId: string;
  stripePriceId: string;
  name: string;
  description: string;
  priceInCents: number;
  currency: string;
}

export interface CreatePaymentIntentParams {
  amountInCents: number;
  currency: string;
  customerId: string;
  metadata?: Record<string, string>;
  billingDetails?: BillingAddress;
}

export interface CreatePaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  trialDays?: number;
  promoCode?: string;
}

export interface CreateSubscriptionResult {
  subscriptionId: string;
  clientSecret: string | null;
  status: string;
}

export interface InvoiceData {
  id: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: string;
  invoicePdfUrl: string | null;
  created: Date;
}

/**
 * Port abstrait pour le service Stripe — découple le domaine de l'infra Stripe.
 */
export abstract class StripeServicePort {
  abstract createCustomer(email: string, name: string): Promise<string>;
  abstract createProduct(params: CreateProductParams): Promise<CreateProductResult>;
  abstract listProductsWithPrices(): Promise<StripeProductWithPrice[]>;
  abstract createPaymentIntent(params: CreatePaymentIntentParams): Promise<CreatePaymentIntentResult>;
  abstract createSubscription(params: CreateSubscriptionParams): Promise<CreateSubscriptionResult>;
  abstract cancelSubscription(stripeSubscriptionId: string): Promise<void>;
  abstract changeSubscriptionPlan(stripeSubscriptionId: string, newPriceId: string): Promise<void>;
  abstract getCustomerInvoices(customerId: string): Promise<InvoiceData[]>;
  abstract constructWebhookEvent(payload: Buffer, signature: string): any;
}

export const STRIPE_SERVICE = Symbol('STRIPE_SERVICE');
