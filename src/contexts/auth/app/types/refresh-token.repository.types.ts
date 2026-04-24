export type CreateRefreshTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  familyId: string;
  parentId?: string | null;
  userAgent?: string | null;
  deviceId?: string | null;
  ipAddress?: string | null;
  tokenVersion?: number;
};
