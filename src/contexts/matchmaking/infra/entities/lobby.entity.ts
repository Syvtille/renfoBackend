import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  VersionColumn,
} from 'typeorm';
import { LobbyStatus } from '../../domain/lobby.model';

/**
 * Entité TypeORM — représentation BDD du Lobby.
 */
@Entity('lobbies')
export class LobbyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  topic: string;

  @Column({ nullable: true })
  playerForId: string;

  @Column({ nullable: true })
  playerAgainstId: string;

  @Column({ nullable: true })
  refereeId: string;

  @Column({ type: 'varchar', default: LobbyStatus.WAITING })
  status: LobbyStatus;

  @Column({ nullable: true })
  winnerId: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  /**
   * Verrou optimiste : TypeORM incrémente automatiquement ce champ à chaque save().
   * Si deux transactions lisent la version N et tentent toutes les deux de sauvegarder,
   * la seconde recevra une OptimisticLockVersionMismatchError car la version en base
   * sera déjà N+1.
   */
  @VersionColumn()
  version: number;
}
