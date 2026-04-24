import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  productId: string;

  @Column()
  amountInCents: number;

  @Column({ default: 'eur' })
  currency: string;

  @Column({ type: 'varchar', default: PaymentStatus.PENDING })
  status: string;

  @Column({ nullable: true })
  stripePaymentIntentId: string;

  // ── Adresse de facturation ────────────────────────────────────────────
  @Column({ nullable: true })
  billingName: string;

  @Column({ nullable: true })
  billingEmail: string;

  @Column({ nullable: true })
  billingLine1: string;

  @Column({ nullable: true })
  billingLine2: string;

  @Column({ nullable: true })
  billingCity: string;

  @Column({ nullable: true })
  billingPostalCode: string;

  @Column({ nullable: true })
  billingCountry: string;

  @CreateDateColumn()
  createdAt: Date;
}
