import { Inject, Injectable } from '@nestjs/common';
import { STRIPE_SERVICE, StripeServicePort } from '../ports/stripe.service.port';

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    @Inject(STRIPE_SERVICE) private readonly stripeService: StripeServicePort,
  ) {}

  async execute(email: string, name: string): Promise<string> {
    return this.stripeService.createCustomer(email, name);
  }
}
