import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { MessageType } from '../../domain/message.model';

/**
 * Entité TypeORM — représentation BDD du Message.
 */
@Entity('messages')
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  lobbyId: string;

  @Column()
  senderId: string;

  @Column()
  senderUsername: string;

  @Column()
  content: string;

  @Column({ type: 'varchar', default: MessageType.CHAT })
  type: MessageType;

  @CreateDateColumn()
  createdAt: Date;
}
