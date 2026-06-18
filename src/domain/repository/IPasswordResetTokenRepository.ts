import { PasswordResetToken } from '../entity/PasswordResetToken';

export interface IPasswordResetTokenRepository {
  findByToken(token: string): Promise<PasswordResetToken | null>;
  findActiveByUserId(userId: string): Promise<PasswordResetToken | null>;
  create(data: Partial<PasswordResetToken>): Promise<PasswordResetToken>;
  markUsed(token: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}
