/**
 * Statuts possibles d'un lobby.
 * Déclaré dans le domain car c'est une règle métier, pas un détail d'infra.
 */
export enum LobbyStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
}

/**
 * Modèle de domaine Lobby — logique métier pure.
 */
export class LobbyModel {
  constructor(
    public readonly id: string,
    public readonly topic: string,
    public playerForId: string | null,
    public playerAgainstId: string | null,
    public refereeId: string | null,
    public status: LobbyStatus,
    public winnerId: string | null,
    public startedAt: Date | null,
    public readonly createdAt: Date,
    /** Version pour le verrouillage optimiste (géré par TypeORM via @VersionColumn) */
    public readonly version: number = 1,
  ) {}

  /** Ajoute le deuxième joueur (contre) */
  addPlayerAgainst(userId: string): void {
    this.playerAgainstId = userId;
  }

  /** L'arbitre rejoint et le débat démarre */
  startDebate(refereeId: string): void {
    this.refereeId = refereeId;
    this.status = LobbyStatus.IN_PROGRESS;
    this.startedAt = new Date();
  }

  /** L'arbitre désigne un gagnant */
  designateWinner(winnerId: string): void {
    this.winnerId = winnerId;
    this.status = LobbyStatus.FINISHED;
  }

  /** Retourne l'ID du perdant */
  getLoserId(): string | null {
    if (!this.winnerId) return null;
    return this.winnerId === this.playerForId
      ? this.playerAgainstId
      : this.playerForId;
  }

  /** Vérifie si un userId est un des deux joueurs */
  isPlayer(userId: string): boolean {
    return this.playerForId === userId || this.playerAgainstId === userId;
  }

  /** Vérifie si le lobby attend encore un joueur */
  needsPlayer(): boolean {
    return this.status === LobbyStatus.WAITING && this.playerAgainstId === null;
  }

  /** Vérifie si le lobby attend un arbitre */
  needsReferee(): boolean {
    return (
      this.status === LobbyStatus.WAITING &&
      this.playerForId !== null &&
      this.playerAgainstId !== null &&
      this.refereeId === null
    );
  }
}
