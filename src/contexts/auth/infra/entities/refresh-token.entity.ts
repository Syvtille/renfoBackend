import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ unique: true })
  @Index()
  tokenHash: string;

  /** UUID partagé par toute la chaîne de la session (Token Family A→B→C→D) */
  @Column()
  @Index()
  familyId: string;

  /** ID du token précédent dans la chaîne (null = premier token de la famille) */
  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  /** User-Agent du client — Device Binding */
  @Column({ type: 'varchar', nullable: true })
  userAgent: string | null;

  /** Identifiant opaque du device envoyé par le client (X-Device-ID) */
  @Column({ type: 'varchar', nullable: true })
  deviceId: string | null;

  /** IP du client au moment de l'émission */
  @Column({ type: 'varchar', nullable: true })
  ipAddress: string | null;

  /** tokenVersion de l'utilisateur au moment de l'émission */
  @Column({ default: 0 })
  tokenVersion: number;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
