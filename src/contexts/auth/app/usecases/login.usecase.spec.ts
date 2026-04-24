import * as bcrypt from 'bcrypt';
import { LoginUseCase } from './login.usecase';
import { UserRepositoryPort } from '../ports/user.repository.port';
import { RefreshTokenRepositoryPort } from '../ports/refresh-token.repository.port';
import { UserEntity } from '../../infra/entities/user.entity';
import { RefreshTokenEntity } from '../../infra/entities/refresh-token.entity';
import { AuthInvalidCredentialsError, AuthAccountDisabledError } from '../../domain/errors/auth.errors';
import { ROLE_PLAYER } from '../../../../shared/permissions/permission.constants';
import { verifyCustomJwt } from '../../../../shared/jwt/jwt.utils';
import { JWT_SECRET } from '../../../../shared/jwt/jwt.constants';
import { RefreshTokenUseCase } from './refresh-token.usecase';

function makeUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return Object.assign(new UserEntity(), {
    id: 'id-1', email: 'a@b.com', username: 'alice',
    passwordHash: 'hash', permissions: ROLE_PLAYER.toString(),
    isActive: true, wins: 0, losses: 0, tokenVersion: 0,
    ...overrides,
  });
}

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockUserRepo: jest.Mocked<UserRepositoryPort>;
  let mockRtRepo: jest.Mocked<RefreshTokenRepositoryPort>;
  let mockRtUseCase: jest.Mocked<Pick<RefreshTokenUseCase, 'generateToken' | 'hashToken'>>;

  beforeEach(() => {
    mockUserRepo = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      atomicIncrementStats: jest.fn(),
      incrementTokenVersion: jest.fn(),
    } as jest.Mocked<UserRepositoryPort>;

    mockRtRepo = {
      create: jest.fn().mockReturnValue(new RefreshTokenEntity()),
      findByTokenHash: jest.fn(),
      save: jest.fn().mockResolvedValue(new RefreshTokenEntity()),
      revoke: jest.fn(),
      revokeAllForUser: jest.fn(),
      revokeByFamilyId: jest.fn(),
    } as jest.Mocked<RefreshTokenRepositoryPort>;

    mockRtUseCase = {
      generateToken: jest.fn().mockReturnValue('raw-refresh-token'),
      hashToken: jest.fn().mockReturnValue('hashed-token'),
    };

    useCase = new LoginUseCase(
      mockUserRepo,
      mockRtRepo,
      mockRtUseCase as unknown as RefreshTokenUseCase,
    );
  });

  it('retourne un JWT signé avec les permissions dans le payload', async () => {
    const hashed = await bcrypt.hash('pass123', 10);
    mockUserRepo.findByEmail.mockResolvedValue(makeUser({ passwordHash: hashed }));

    const res = await useCase.execute('a@b.com', 'pass123');

    expect(res.refreshToken).toBe('raw-refresh-token');
    const decoded = verifyCustomJwt(res.accessToken, JWT_SECRET);
    expect(decoded.sub).toBe('id-1');
    expect(decoded.username).toBe('alice');
    expect(decoded.permissions).toBe(ROLE_PLAYER.toString());
  });

  it('lève AuthInvalidCredentialsError si le user n\'existe pas', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    await expect(useCase.execute('x@x.com', 'pass')).rejects.toThrow(AuthInvalidCredentialsError);
  });

  it('lève AuthInvalidCredentialsError si le mot de passe est incorrect', async () => {
    const hashed = await bcrypt.hash('correct', 10);
    mockUserRepo.findByEmail.mockResolvedValue(makeUser({ passwordHash: hashed }));
    await expect(useCase.execute('a@b.com', 'wrong')).rejects.toThrow(AuthInvalidCredentialsError);
  });

  it('lève AuthAccountDisabledError si le compte est désactivé', async () => {
    const hashed = await bcrypt.hash('pass', 10);
    mockUserRepo.findByEmail.mockResolvedValue(makeUser({ passwordHash: hashed, isActive: false }));
    await expect(useCase.execute('a@b.com', 'pass')).rejects.toThrow(AuthAccountDisabledError);
  });
});
