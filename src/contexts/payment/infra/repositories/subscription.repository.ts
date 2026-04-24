import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionEntity } from '../entities/subscription.entity';
import { SubscriptionModel } from '../../domain/subscription.model';
import { SubscriptionRepositoryPort } from '../../app/ports/subscription.repository.port';
import { SubscriptionStatus } from '../../domain/enums/subscription-status.enum';
import { PlanInterval } from '../../domain/enums/plan-interval.enum';

@Injectable()
export class SubscriptionRepository implements SubscriptionRepositoryPort {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly repo: Repository<SubscriptionEntity>,
  ) {}

  private toModel(e: SubscriptionEntity): SubscriptionModel {
    return new SubscriptionModel(
      e.id,
      e.userId,
      e.planInterval as PlanInterval,
      e.status as SubscriptionStatus,
      e.stripeSubscriptionId,
      e.stripeCustomerId,
      e.currentPeriodStart,
      e.currentPeriodEnd,
      e.trialEnd,
      e.cancelAtPeriodEnd,
      e.createdAt,
    );
  }

  async findById(id: string): Promise<SubscriptionModel | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? this.toModel(e) : null;
  }

  async findByUserId(userId: string): Promise<SubscriptionModel | null> {
    const e = await this.repo.findOne({ where: { userId }, order: { createdAt: 'DESC' } });
    return e ? this.toModel(e) : null;
  }

  async findByStripeSubscriptionId(stripeSubId: string): Promise<SubscriptionModel | null> {
    const e = await this.repo.findOne({ where: { stripeSubscriptionId: stripeSubId } });
    return e ? this.toModel(e) : null;
  }

  async findByStripeCustomerId(customerId: string): Promise<SubscriptionModel | null> {
    const e = await this.repo.findOne({ where: { stripeCustomerId: customerId }, order: { createdAt: 'DESC' } });
    return e ? this.toModel(e) : null;
  }

  async save(subscription: Partial<SubscriptionModel>): Promise<SubscriptionModel> {
    const e = await this.repo.save(subscription as any);
    return this.toModel(e);
  }

  async update(id: string, data: Partial<SubscriptionModel>): Promise<SubscriptionModel> {
    await this.repo.update(id, data as any);
    const e = await this.repo.findOneOrFail({ where: { id } });
    return this.toModel(e);
  }
}
