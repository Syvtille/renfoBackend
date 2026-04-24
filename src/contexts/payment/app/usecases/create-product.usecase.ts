import { Inject, Injectable } from '@nestjs/common';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { STRIPE_SERVICE, StripeServicePort } from '../ports/stripe.service.port';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: ProductRepositoryPort,
    @Inject(STRIPE_SERVICE) private readonly stripeService: StripeServicePort,
  ) {}

  async execute(name: string, description: string, priceInCents: number, currency: string) {
    const { stripeProductId, stripePriceId } = await this.stripeService.createProduct({
      name,
      description,
      priceInCents,
      currency,
    });

    const product = await this.productRepo.save({
      name,
      description,
      priceInCents,
      currency,
      stripeProductId,
      stripePriceId,
      isActive: true,
    } as any);

    return product;
  }
}
