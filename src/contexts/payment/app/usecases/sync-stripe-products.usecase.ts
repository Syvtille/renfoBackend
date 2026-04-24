import { Inject, Injectable, Logger } from '@nestjs/common';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { STRIPE_SERVICE, StripeServicePort } from '../ports/stripe.service.port';

@Injectable()
export class SyncStripeProductsUseCase {
  private readonly logger = new Logger(SyncStripeProductsUseCase.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: ProductRepositoryPort,
    @Inject(STRIPE_SERVICE) private readonly stripeService: StripeServicePort,
  ) {}

  async execute() {
    const stripeProducts = await this.stripeService.listProductsWithPrices();
    const results = { created: 0, updated: 0 };

    for (const sp of stripeProducts) {
      const existing = await this.productRepo.findByStripeProductId(sp.stripeProductId);

      if (existing) {
        await this.productRepo.save({
          ...existing,
          name: sp.name,
          description: sp.description,
          priceInCents: sp.priceInCents,
          currency: sp.currency,
          stripePriceId: sp.stripePriceId,
          isActive: true,
        } as any);
        results.updated++;
        this.logger.log(`Updated product: ${sp.name}`);
      } else {
        await this.productRepo.save({
          name: sp.name,
          description: sp.description,
          priceInCents: sp.priceInCents,
          currency: sp.currency,
          stripeProductId: sp.stripeProductId,
          stripePriceId: sp.stripePriceId,
          isActive: true,
        } as any);
        results.created++;
        this.logger.log(`Created product: ${sp.name}`);
      }
    }

    return { synced: stripeProducts.length, ...results };
  }
}
