import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ROLE_PLAYER } from '../../../../shared/permissions/permission.constants';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  /** Bitmask de permissions stocké en varchar */
  @Column({ type: 'varchar', default: ROLE_PLAYER.toString() })
  permissions: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ default: 0 })
  wins: number;

  @Column({ default: 0 })
  losses: number;

  /** Incrémentée pour invalider tous les refresh tokens actifs */
  @Column({ name: 'token_version', default: 0 })
  tokenVersion: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
