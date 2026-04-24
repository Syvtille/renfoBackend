import { UserEntity } from '../../infra/entities/user.entity';

export type UserPublicPresenter = {
  id: string;
  email: string;
  username: string;
  permissions: string;
  isActive: boolean;
  wins: number;
  losses: number;
};

export type UserStatsPresenter = {
  id: string;
  username: string;
  wins: number;
  losses: number;
};

export type TokensPresenter = {
  accessToken: string;
  refreshToken: string;
  securityAlert?: string;
};

export function toUserPublic(entity: UserEntity): UserPublicPresenter {
  return {
    id: entity.id,
    email: entity.email,
    username: entity.username,
    permissions: entity.permissions,
    isActive: entity.isActive,
    wins: entity.wins,
    losses: entity.losses,
  };
}

export function toUserStats(entity: UserEntity): UserStatsPresenter {
  return {
    id: entity.id,
    username: entity.username,
    wins: entity.wins,
    losses: entity.losses,
  };
}
