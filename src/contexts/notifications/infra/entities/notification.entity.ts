import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { NotificationType } from '../../domain/notification.model';

/**
 * Entité TypeORM — Notification persistée en BDD.
 */
@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'varchar', default: NotificationType.SYSTEM })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  body: string;

  /** Données supplémentaires sérialisées en JSON (lobbyId, senderId, etc.) */
  @Column({ type: 'text', nullable: true })
  data: string | null;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
