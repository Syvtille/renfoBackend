import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { ProductModel } from '../../domain/product.model';
import { ProductRepositoryPort } from '../../app/ports/product.repository.port';

@Injectable()
export class ProductRepository implements ProductRepositoryPort {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repo: Repository<ProductEntity>,
  ) {}

  private toModel(e: ProductEntity): ProductModel {
    return new ProductModel(
      e.id,
      e.name,
      e.description,
      e.priceInCents,
      e.currency,
      e.stripeProductId,
      e.stripePriceId,
      e.isActive,
      e.createdAt,
      e.shortDescription ?? null,
      e.features ?? null,
      e.badgeText ?? null,
      e.isPopular,
    );
  }

  async findById(id: string): Promise<ProductModel | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? this.toModel(e) : null;
  }

  async findAll(): Promise<ProductModel[]> {
    return (await this.repo.find()).map((e) => this.toModel(e));
  }

  async findActive(): Promise<ProductModel[]> {
    return (await this.repo.find({ where: { isActive: true } })).map((e) => this.toModel(e));
  }

  async findByStripeProductId(stripeProductId: string): Promise<ProductModel | null> {
    const e = await this.repo.findOne({ where: { stripeProductId } });
    return e ? this.toModel(e) : null;
  }

  async save(product: Partial<ProductModel>): Promise<ProductModel> {
    const e = await this.repo.save(product as any);
    return this.toModel(e);
  }
}
