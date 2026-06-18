import { RefreshToken } from '../entity/RefreshToken';

export interface IRefreshTokenRepository {
  findByToken(token: string): Promise<RefreshToken | null>;
  create(data: Partial<RefreshToken>): Promise<RefreshToken>;
  revoke(token: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<void>;
}
