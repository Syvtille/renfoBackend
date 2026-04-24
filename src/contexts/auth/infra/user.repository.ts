import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { UserRepositoryPort } from '../app/ports/user.repository.port';
import { CreateUserInput } from '../app/types/user.repository.types';
import { ROLE_PLAYER } from '../../../shared/permissions/permission.constants';

@Injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  create(input: CreateUserInput): UserEntity {
    return this.repo.create({
      email: input.email,
      username: input.username,
      passwordHash: input.passwordHash,
      permissions: input.permissions ?? ROLE_PLAYER.toString(),
      isActive: true,
      wins: 0,
      losses: 0,
      tokenVersion: 0,
    });
  }

  async save(user: UserEntity): Promise<UserEntity> {
    return this.repo.save(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { username } });
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findAll(): Promise<UserEntity[]> {
    return this.repo.find();
  }

  async atomicIncrementStats(winnerId: string, loserId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.createQueryBuilder()
        .update(UserEntity)
        .set({ wins: () => 'wins + 1' })
        .where('id = :id', { id: winnerId })
        .execute();

      await manager.createQueryBuilder()
        .update(UserEntity)
        .set({ losses: () => 'losses + 1' })
        .where('id = :id', { id: loserId })
        .execute();
    });
  }

  async incrementTokenVersion(userId: string): Promise<void> {
    await this.repo.createQueryBuilder()
      .update()
      .set({ tokenVersion: () => 'token_version + 1' })
      .where('id = :id', { id: userId })
      .execute();
  }
}
