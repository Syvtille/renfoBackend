import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { SubscriptionStatus } from '../../domain/enums/subscription-status.enum';
import { PlanInterval } from '../../domain/enums/plan-interval.enum';

@Entity('subscriptions')
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'varchar', default: PlanInterval.MONTHLY })
  planInterval: string;

  @Column({ type: 'varchar', default: SubscriptionStatus.TRIALING })
  status: string;

  @Column({ nullable: true })
  stripeSubscriptionId: string;

  @Column()
  stripeCustomerId: string;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd: Date;

  @Column({ type: 'timestamp', nullable: true })
  trialEnd: Date;

  @Column({ default: false })
  cancelAtPeriodEnd: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
