import { ProductModel } from '../../domain/product.model.js';

export abstract class ProductRepositoryPort {
  abstract findById(id: string): Promise<ProductModel | null>;
  abstract findAll(): Promise<ProductModel[]>;
  abstract findActive(): Promise<ProductModel[]>;
  abstract findByStripeProductId(stripeProductId: string): Promise<ProductModel | null>;
  abstract save(product: Partial<ProductModel>): Promise<ProductModel>;
}

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
