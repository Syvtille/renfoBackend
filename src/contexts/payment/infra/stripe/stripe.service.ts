import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import {
  StripeServicePort,
  CreateProductParams,
  CreateProductResult,
  CreatePaymentIntentParams,
  CreatePaymentIntentResult,
  CreateSubscriptionParams,
  CreateSubscriptionResult,
  StripeProductWithPrice,
  InvoiceData,
} from '../../app/ports/stripe.service.port';

@Injectable()
export class StripeService implements StripeServicePort {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly logger = new Logger(StripeService.name);

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
  }

  private handleStripeError(e: any): never {
    this.logger.error(`Stripe error: ${e?.message}`, e?.stack);
    if (e instanceof Stripe.errors.StripeError) {
      throw new BadRequestException(`Stripe: ${e.message}`);
    }
    throw new InternalServerErrorException(e?.message ?? 'Unknown error');
  }

  async createCustomer(email: string, name: string): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({ email, name });
      return customer.id;
    } catch (e) { this.handleStripeError(e); }
  }

  async createProduct(params: CreateProductParams): Promise<CreateProductResult> {
    try {
      const product = await this.stripe.products.create({
        name: params.name,
        description: params.description,
      });
      const price = await this.stripe.prices.create({
        product: product.id,
        unit_amount: params.priceInCents,
        currency: params.currency,
      });
      return { stripeProductId: product.id, stripePriceId: price.id };
    } catch (e) { this.handleStripeError(e); }
  }

  async listProductsWithPrices(): Promise<StripeProductWithPrice[]> {
    try {
      const products = await this.stripe.products.list({
        active: true,
        expand: ['data.default_price'],
      });

      const results: StripeProductWithPrice[] = [];
      for (const p of products.data) {
        const defaultPrice = p.default_price as Stripe.Price | null;
        if (!defaultPrice || !defaultPrice.unit_amount) continue;
        results.push({
          stripeProductId: p.id,
          stripePriceId: defaultPrice.id,
          name: p.name,
          description: p.description ?? '',
          priceInCents: defaultPrice.unit_amount,
          currency: defaultPrice.currency,
        });
      }
      return results;
    } catch (e) { this.handleStripeError(e); }
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<CreatePaymentIntentResult> {
    try {
      const intentData: Stripe.PaymentIntentCreateParams = {
        amount: params.amountInCents,
        currency: params.currency,
        customer: params.customerId,
        metadata: {
          ...(params.metadata ?? {}),
          ...(params.billingDetails ? {
            billingName: params.billingDetails.name,
            billingEmail: params.billingDetails.email,
            billingCity: params.billingDetails.city,
            billingCountry: params.billingDetails.country,
          } : {}),
        },
        automatic_payment_methods: { enabled: true },
      };

      const paymentIntent = await this.stripe.paymentIntents.create(intentData);
      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (e) { this.handleStripeError(e); }
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<CreateSubscriptionResult> {
    try {
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: params.customerId,
        items: [{ price: params.priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      };

      if (params.trialDays && params.trialDays > 0) {
        subscriptionData.trial_period_days = params.trialDays;
      }

      if (params.promoCode) {
        const promoCodes = await this.stripe.promotionCodes.list({
          code: params.promoCode,
          active: true,
          limit: 1,
        });
        if (promoCodes.data.length === 0) {
          throw new BadRequestException('Invalid promo code');
        }
        (subscriptionData as any).promotion_code = promoCodes.data[0].id;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionData);

      let clientSecret: string | null = null;
      if (subscription.status !== 'trialing') {
        const invoice = subscription.latest_invoice as Stripe.Invoice;
        const paymentIntent = (invoice as any)?.payment_intent as Stripe.PaymentIntent;
        clientSecret = paymentIntent?.client_secret ?? null;
      }

      return { subscriptionId: subscription.id, clientSecret, status: subscription.status };
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      this.handleStripeError(e);
    }
  }

  async cancelSubscription(stripeSubscriptionId: string): Promise<void> {
    try {
      await this.stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: true });
    } catch (e) { this.handleStripeError(e); }
  }

  async changeSubscriptionPlan(stripeSubscriptionId: string, newPriceId: string): Promise<void> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
      await this.stripe.subscriptions.update(stripeSubscriptionId, {
        items: [{ id: subscription.items.data[0].id, price: newPriceId }],
        proration_behavior: 'create_prorations',
      });
    } catch (e) { this.handleStripeError(e); }
  }

  async getCustomerInvoices(customerId: string): Promise<InvoiceData[]> {
    try {
      const invoices = await this.stripe.invoices.list({ customer: customerId, limit: 24 });
      return invoices.data.map((inv) => ({
        id: inv.id,
        amountDue: inv.amount_due,
        amountPaid: inv.amount_paid,
        currency: inv.currency,
        status: inv.status ?? 'unknown',
        invoicePdfUrl: inv.invoice_pdf ?? null,
        created: new Date(inv.created * 1000),
      }));
    } catch (e) { this.handleStripeError(e); }
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
  }
}
