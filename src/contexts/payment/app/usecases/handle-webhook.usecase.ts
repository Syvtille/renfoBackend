import { Inject, Injectable, Logger } from '@nestjs/common';
import { PAYMENT_REPOSITORY, PaymentRepositoryPort } from '../ports/payment.repository.port';
import { SUBSCRIPTION_REPOSITORY, SubscriptionRepositoryPort } from '../ports/subscription.repository.port';
import { STRIPE_SERVICE, StripeServicePort } from '../ports/stripe.service.port';
import { SendPaymentReceiptUseCase } from './send-payment-receipt.usecase';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { SubscriptionStatus } from '../../domain/enums/subscription-status.enum';

@Injectable()
export class HandleWebhookUseCase {
  private readonly logger = new Logger(HandleWebhookUseCase.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: PaymentRepositoryPort,
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptionRepo: SubscriptionRepositoryPort,
    @Inject(STRIPE_SERVICE) private readonly stripeService: StripeServicePort,
    private readonly sendPaymentReceipt: SendPaymentReceiptUseCase,
  ) {}

  async execute(payload: Buffer, signature: string) {
    const event = this.stripeService.constructWebhookEvent(payload, signature);
    this.logger.log(`Webhook received: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.created':
        this.logger.log(`Subscription created: ${event.data.object.id}`);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'customer.subscription.trial_will_end':
        this.logger.log(`Trial ending soon for subscription ${event.data.object.id}`);
        break;
      case 'invoice.payment_succeeded':
        this.logger.log(`Invoice paid: ${event.data.object.id}`);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSucceeded(paymentIntent: any) {
    const payment = await this.paymentRepo.findByStripePaymentIntentId(paymentIntent.id);
    if (!payment) return;

    const updated = await this.paymentRepo.update(payment.id, { status: PaymentStatus.SUCCEEDED });
    this.logger.log(`Payment ${payment.id} marked as succeeded`);

    // Envoi du reçu par email
    await this.sendPaymentReceipt.execute(updated);
  }

  private async handlePaymentFailed(paymentIntent: any) {
    const payment = await this.paymentRepo.findByStripePaymentIntentId(paymentIntent.id);
    if (payment) {
      await this.paymentRepo.update(payment.id, { status: PaymentStatus.FAILED });
      this.logger.log(`Payment ${payment.id} marked as failed`);
    }
  }

  private async handleSubscriptionUpdated(stripeSubscription: any) {
    const subscription = await this.subscriptionRepo.findByStripeSubscriptionId(stripeSubscription.id);
    if (!subscription) return;

    const statusMap: Record<string, SubscriptionStatus> = {
      trialing: SubscriptionStatus.TRIALING,
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      unpaid: SubscriptionStatus.UNPAID,
    };

    const newStatus = statusMap[stripeSubscription.status] ?? subscription.status;
    await this.subscriptionRepo.update(subscription.id, {
      status: newStatus,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    } as any);
    this.logger.log(`Subscription ${subscription.id} updated to ${newStatus}`);
  }

  private async handleSubscriptionDeleted(stripeSubscription: any) {
    const subscription = await this.subscriptionRepo.findByStripeSubscriptionId(stripeSubscription.id);
    if (subscription) {
      await this.subscriptionRepo.update(subscription.id, { status: SubscriptionStatus.CANCELED } as any);
      this.logger.log(`Subscription ${subscription.id} canceled`);
    }
  }

  private async handleInvoicePaymentFailed(invoice: any) {
    const subscription = await this.subscriptionRepo.findByStripeCustomerId(invoice.customer);
    if (subscription) {
      await this.subscriptionRepo.update(subscription.id, { status: SubscriptionStatus.PAST_DUE } as any);
      this.logger.log(`Subscription ${subscription.id} marked past_due after invoice failure`);
    }
  }
}
