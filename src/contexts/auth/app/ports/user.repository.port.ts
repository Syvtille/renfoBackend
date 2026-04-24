import { UserEntity } from '../../infra/entities/user.entity';
import { CreateUserInput } from '../types/user.repository.types';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export abstract class UserRepositoryPort {
  abstract create(input: CreateUserInput): UserEntity;
  abstract save(user: UserEntity): Promise<UserEntity>;
  abstract findByEmail(email: string): Promise<UserEntity | null>;
  abstract findByUsername(username: string): Promise<UserEntity | null>;
  abstract findById(id: string): Promise<UserEntity | null>;
  abstract findAll(): Promise<UserEntity[]>;
  abstract atomicIncrementStats(winnerId: string, loserId: string): Promise<void>;
  abstract incrementTokenVersion(userId: string): Promise<void>;
}
