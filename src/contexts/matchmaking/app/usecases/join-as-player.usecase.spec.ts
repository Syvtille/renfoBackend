import { JoinAsPlayerUseCase } from './join-as-player.usecase';
import { LobbyRepositoryPort } from '../ports/lobby.repository.port';
import { TopicRepositoryPort } from '../ports/topic.repository.port';
import { LobbyModel, LobbyStatus } from '../../domain/lobby.model';

const makeLobby = (overrides: Partial<{
  id: string; topic: string; playerForId: string | null; playerAgainstId: string | null;
  refereeId: string | null; status: LobbyStatus; winnerId: string | null; startedAt: Date | null;
}> = {}): LobbyModel => {
  const d = {
    id: 'lobby-1', topic: 'Test', playerForId: 'p1', playerAgainstId: null,
    refereeId: null, status: LobbyStatus.WAITING, winnerId: null, startedAt: null,
  };
  const m = { ...d, ...overrides };
  return new LobbyModel(m.id, m.topic, m.playerForId, m.playerAgainstId, m.refereeId, m.status, m.winnerId, m.startedAt, new Date());
};

describe('JoinAsPlayerUseCase', () => {
  let useCase: JoinAsPlayerUseCase;
  let mockLobbyRepo: jest.Mocked<LobbyRepositoryPort>;
  let mockTopicRepo: jest.Mocked<TopicRepositoryPort>;

  beforeEach(() => {
    mockLobbyRepo = {
      findById: jest.fn(), findWaitingLobbyForPlayer: jest.fn(),
      findWaitingLobbyForReferee: jest.fn(), findActiveByUserId: jest.fn(), save: jest.fn(),
      joinPlayerAtomically: jest.fn(), joinRefereeAtomically: jest.fn(),
    } as jest.Mocked<LobbyRepositoryPort>;
    mockTopicRepo = {
      findAll: jest.fn(), findRandom: jest.fn(), save: jest.fn(),
    } as jest.Mocked<TopicRepositoryPort>;
    useCase = new JoinAsPlayerUseCase(mockLobbyRepo, mockTopicRepo);
  });

  it('délègue à joinPlayerAtomically avec un topic de la base', async () => {
    mockTopicRepo.findRandom.mockResolvedValue({ id: 't1', content: 'La RE2020' } as any);
    mockLobbyRepo.joinPlayerAtomically.mockResolvedValue({
      lobby: makeLobby({ playerForId: 'u1' }),
      position: 'for',
    } as any);

    const res = await useCase.execute('u1');

    expect(mockLobbyRepo.joinPlayerAtomically).toHaveBeenCalledWith('u1', 'La RE2020');
    expect(res.position).toBe('for');
  });

  it('fallback sur topic statique si la table est vide', async () => {
    mockTopicRepo.findRandom.mockResolvedValue(null);
    mockLobbyRepo.joinPlayerAtomically.mockResolvedValue({
      lobby: makeLobby({ playerForId: 'u1', playerAgainstId: 'u2' }),
      position: 'against',
    } as any);

    const res = await useCase.execute('u2');

    expect(mockLobbyRepo.joinPlayerAtomically).toHaveBeenCalled();
    const [userId, topic] = mockLobbyRepo.joinPlayerAtomically.mock.calls[0];
    expect(userId).toBe('u2');
    expect(typeof topic).toBe('string');
    expect(topic.length).toBeGreaterThan(0);
    expect(res.position).toBe('against');
  });
});
