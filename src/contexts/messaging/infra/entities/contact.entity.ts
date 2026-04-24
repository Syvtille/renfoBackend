import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * Entité TypeORM — Contact dans la liste de contacts d'un utilisateur.
 */
@Entity('contacts')
export class ContactEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ownerId: string;

  @Column()
  contactId: string;

  @Column()
  contactUsername: string;

  @CreateDateColumn()
  addedAt: Date;
}
