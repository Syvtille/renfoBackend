/**
 * Modèle de domaine Product — représente un produit one-shot achetable.
 */
export class ProductModel {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly priceInCents: number,
    public readonly currency: string,
    public readonly stripeProductId: string | null,
    public readonly stripePriceId: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly shortDescription: string | null,
    public readonly features: string[] | null,
    public readonly badgeText: string | null,
    public readonly isPopular: boolean,
  ) {}

  isAvailable(): boolean {
    return this.isActive && this.stripeProductId !== null && this.stripePriceId !== null;
  }
}
