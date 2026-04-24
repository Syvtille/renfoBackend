import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from '../entities/payment.entity';
import { BillingAddress, PaymentModel } from '../../domain/payment.model';
import { PaymentRepositoryPort } from '../../app/ports/payment.repository.port';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';

@Injectable()
export class PaymentRepository implements PaymentRepositoryPort {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly repo: Repository<PaymentEntity>,
  ) {}

  private toModel(e: PaymentEntity): PaymentModel {
    const billingAddress: BillingAddress | null = e.billingName
      ? {
          name: e.billingName,
          email: e.billingEmail,
          line1: e.billingLine1,
          line2: e.billingLine2 ?? undefined,
          city: e.billingCity,
          postalCode: e.billingPostalCode,
          country: e.billingCountry,
        }
      : null;

    return new PaymentModel(
      e.id,
      e.userId,
      e.productId,
      e.amountInCents,
      e.currency,
      e.status as PaymentStatus,
      e.stripePaymentIntentId,
      billingAddress,
      e.createdAt,
    );
  }

  async findById(id: string): Promise<PaymentModel | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? this.toModel(e) : null;
  }

  async findByUserId(userId: string): Promise<PaymentModel[]> {
    const entities = await this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return entities.map((e) => this.toModel(e));
  }

  async findByStripePaymentIntentId(intentId: string): Promise<PaymentModel | null> {
    const e = await this.repo.findOne({ where: { stripePaymentIntentId: intentId } });
    return e ? this.toModel(e) : null;
  }

  async save(payment: any): Promise<PaymentModel> {
    const { billingAddress, ...rest } = payment;
    const flat = billingAddress
      ? {
          ...rest,
          billingName: billingAddress.name,
          billingEmail: billingAddress.email,
          billingLine1: billingAddress.line1,
          billingLine2: billingAddress.line2 ?? null,
          billingCity: billingAddress.city,
          billingPostalCode: billingAddress.postalCode,
          billingCountry: billingAddress.country,
        }
      : rest;
    const e = await this.repo.save(flat);
    return this.toModel(e);
  }

  async update(id: string, data: any): Promise<PaymentModel> {
    await this.repo.update(id, data);
    const e = await this.repo.findOneOrFail({ where: { id } });
    return this.toModel(e);
  }
}
