import { Injectable, Inject } from '@nestjs/common';
import { OptimisticLockVersionMismatchError } from 'typeorm';
import { LOBBY_REPOSITORY, LobbyRepositoryPort } from '../ports/lobby.repository.port';
import { LobbyStatus } from '../../domain/lobby.model';
import { UpdateStatsUseCase } from '../../../auth/app/usecases/update-stats.usecase';
import {
  MatchmakingLobbyNotFoundError,
  MatchmakingNotRefereeError,
  MatchmakingLobbyNotInProgressError,
  MatchmakingInvalidWinnerError,
  MatchmakingConcurrentUpdateError,
} from '../../domain/errors/matchmaking.errors';

@Injectable()
export class DesignateWinnerUseCase {
  constructor(
    @Inject(LOBBY_REPOSITORY) private readonly lobbyRepo: LobbyRepositoryPort,
    private readonly updateStats: UpdateStatsUseCase,
  ) {}

  async execute(lobbyId: string, refereeId: string, winnerId: string) {
    const lobby = await this.lobbyRepo.findById(lobbyId);
    if (!lobby) throw new MatchmakingLobbyNotFoundError();

    // Ownership: only the lobby's own referee can designate a winner
    if (lobby.refereeId !== refereeId) throw new MatchmakingNotRefereeError();
    if (lobby.status !== LobbyStatus.IN_PROGRESS) throw new MatchmakingLobbyNotInProgressError();
    if (!lobby.isPlayer(winnerId)) throw new MatchmakingInvalidWinnerError();

    lobby.designateWinner(winnerId);

    let saved;
    try {
      /**
       * Verrou optimiste (@VersionColumn sur LobbyEntity) :
       * si deux arbitres désignent un gagnant en même temps, le second reçoit
       * OptimisticLockVersionMismatchError car la version a déjà été incrémentée.
       */
      saved = await this.lobbyRepo.save(lobby);
    } catch (err) {
      if (err instanceof OptimisticLockVersionMismatchError) {
        throw new MatchmakingConcurrentUpdateError();
      }
      throw err;
    }

    const loserId = lobby.getLoserId();
    if (loserId) {
      await this.updateStats.execute(winnerId, loserId);
    }

    return saved;
  }
}
