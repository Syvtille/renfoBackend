import { Controller, Post, Req, Headers, RawBody } from '@nestjs/common';
import { HandleWebhookUseCase } from '../app/usecases/handle-webhook.usecase';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly handleWebhook: HandleWebhookUseCase) {}

  /** Endpoint Stripe webhook — pas d'auth JWT, vérifié par signature Stripe */
  @Post('stripe')
  async stripeWebhook(
    @RawBody() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.handleWebhook.execute(rawBody, signature);
  }
}
