import { DesignateWinnerUseCase } from './designate-winner.usecase';
import { LobbyRepositoryPort } from '../ports/lobby.repository.port';
import { UpdateStatsUseCase } from '../../../auth/app/usecases/update-stats.usecase';
import { LobbyModel, LobbyStatus } from '../../domain/lobby.model';
import {
  MatchmakingLobbyNotFoundError,
  MatchmakingNotRefereeError,
  MatchmakingInvalidWinnerError,
} from '../../domain/errors/matchmaking.errors';

const makeLobby = (): LobbyModel =>
  new LobbyModel('l1', 'topic', 'player-for', 'player-against', 'ref-1', LobbyStatus.IN_PROGRESS, null, new Date(), new Date());

describe('DesignateWinnerUseCase', () => {
  let useCase: DesignateWinnerUseCase;
  let mockRepo: jest.Mocked<LobbyRepositoryPort>;
  let mockUpdateStats: jest.Mocked<UpdateStatsUseCase>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(), findWaitingLobbyForPlayer: jest.fn(),
      findWaitingLobbyForReferee: jest.fn(), findActiveByUserId: jest.fn(), save: jest.fn(),
      joinPlayerAtomically: jest.fn(), joinRefereeAtomically: jest.fn(),
    } as jest.Mocked<LobbyRepositoryPort>;
    mockUpdateStats = { execute: jest.fn().mockResolvedValue(undefined) } as any;
    useCase = new DesignateWinnerUseCase(mockRepo, mockUpdateStats);
  });

  it('désigne le gagnant, passe en FINISHED, met à jour les stats', async () => {
    const lobby = makeLobby();
    mockRepo.findById.mockResolvedValue(lobby);
    mockRepo.save.mockImplementation(async (l) => l as LobbyModel);
    const res = await useCase.execute('l1', 'ref-1', 'player-for');
    expect(res.status).toBe(LobbyStatus.FINISHED);
    expect(res.winnerId).toBe('player-for');
    expect(mockUpdateStats.execute).toHaveBeenCalledWith('player-for', 'player-against');
  });

  it('lève MatchmakingLobbyNotFoundError si le lobby n\'existe pas', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('l1', 'ref-1', 'player-for')).rejects.toThrow(MatchmakingLobbyNotFoundError);
  });

  it('lève MatchmakingNotRefereeError si ce n\'est pas l\'arbitre (ownership)', async () => {
    mockRepo.findById.mockResolvedValue(makeLobby());
    await expect(useCase.execute('l1', 'bad-ref', 'player-for')).rejects.toThrow(MatchmakingNotRefereeError);
  });

  it('lève MatchmakingInvalidWinnerError si le gagnant n\'est pas un joueur', async () => {
    mockRepo.findById.mockResolvedValue(makeLobby());
    await expect(useCase.execute('l1', 'ref-1', 'random')).rejects.toThrow(MatchmakingInvalidWinnerError);
  });
});
