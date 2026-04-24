import { RegisterUseCase } from './register.usecase';
import { UserRepositoryPort } from '../ports/user.repository.port';
import { UserEntity } from '../../infra/entities/user.entity';
import { AuthEmailAlreadyTakenError, AuthUsernameAlreadyTakenError } from '../../domain/errors/auth.errors';
import { ROLE_PLAYER, ROLE_REFEREE } from '../../../../shared/permissions/permission.constants';
import { BloomFilterPort } from '../../../../core/bloom/bloom-filter.port';

function makeUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return Object.assign(new UserEntity(), {
    id: 'id-1', email: 'alice@test.com', username: 'alice',
    passwordHash: 'hash', permissions: ROLE_PLAYER.toString(),
    isActive: true, wins: 0, losses: 0, tokenVersion: 0,
    ...overrides,
  });
}

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let mockRepo: jest.Mocked<UserRepositoryPort>;
  let mockBloom: jest.Mocked<BloomFilterPort>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      atomicIncrementStats: jest.fn(),
      incrementTokenVersion: jest.fn(),
    } as jest.Mocked<UserRepositoryPort>;
    mockBloom = {
      mightExist: jest.fn().mockResolvedValue(false),
      add: jest.fn().mockResolvedValue(undefined),
      stats: jest.fn(),
    } as jest.Mocked<BloomFilterPort>;
    useCase = new RegisterUseCase(mockRepo, mockBloom);
  });

  it('inscrit un joueur avec ROLE_PLAYER', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.findByUsername.mockResolvedValue(null);
    const entity = makeUser({ permissions: ROLE_PLAYER.toString() });
    mockRepo.create.mockReturnValue(entity);
    mockRepo.save.mockResolvedValue(entity);

    const res = await useCase.execute('alice@test.com', 'alice', 'password123', 'player');
    expect(res.permissions).toBe(ROLE_PLAYER.toString());
    expect(res.email).toBe('alice@test.com');
  });

  it('inscrit un arbitre avec ROLE_REFEREE', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.findByUsername.mockResolvedValue(null);
    const entity = makeUser({ permissions: ROLE_REFEREE.toString() });
    mockRepo.create.mockReturnValue(entity);
    mockRepo.save.mockResolvedValue(entity);

    const res = await useCase.execute('bob@test.com', 'bob', 'password123', 'referee');
    expect(res.permissions).toBe(ROLE_REFEREE.toString());
  });

  it('lève AuthEmailAlreadyTakenError si l\'email est déjà pris', async () => {
    mockBloom.mightExist.mockResolvedValue(true);
    mockRepo.findByEmail.mockResolvedValue(makeUser());
    mockRepo.findByUsername.mockResolvedValue(null);
    await expect(useCase.execute('alice@test.com', 'alice', 'pass', 'player'))
      .rejects.toThrow(AuthEmailAlreadyTakenError);
  });

  it('lève AuthUsernameAlreadyTakenError si le username est déjà pris', async () => {
    mockBloom.mightExist.mockResolvedValue(true);
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.findByUsername.mockResolvedValue(makeUser());
    await expect(useCase.execute('new@test.com', 'alice', 'pass', 'player'))
      .rejects.toThrow(AuthUsernameAlreadyTakenError);
  });

  it('skip la requête DB quand le bloom filter confirme l\'absence', async () => {
    mockBloom.mightExist.mockResolvedValue(false);
    const entity = makeUser();
    mockRepo.create.mockReturnValue(entity);
    mockRepo.save.mockResolvedValue(entity);

    await useCase.execute('brandnew@test.com', 'brandnew', 'password123', 'player');

    expect(mockRepo.findByEmail).not.toHaveBeenCalled();
    expect(mockRepo.findByUsername).not.toHaveBeenCalled();
    expect(mockBloom.add).toHaveBeenCalledWith('user:email', entity.email);
    expect(mockBloom.add).toHaveBeenCalledWith('user:username', entity.username);
  });
});
