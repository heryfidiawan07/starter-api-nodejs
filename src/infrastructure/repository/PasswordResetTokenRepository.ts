import { DataSource, IsNull, MoreThan } from 'typeorm';
import { PasswordResetToken } from '../../domain/entity/PasswordResetToken';
import { IPasswordResetTokenRepository } from '../../domain/repository/IPasswordResetTokenRepository';

export class PasswordResetTokenRepository implements IPasswordResetTokenRepository {
  private repo = this.ds.getRepository(PasswordResetToken);

  constructor(private readonly ds: DataSource) {}

  async findByToken(token: string): Promise<PasswordResetToken | null> {
    return this.repo.findOne({ where: { token } });
  }

  async findActiveByUserId(userId: string): Promise<PasswordResetToken | null> {
    return this.repo.findOne({
      where: { user_id: userId, used_at: IsNull(), expires_at: MoreThan(new Date()) },
    });
  }

  async create(data: Partial<PasswordResetToken>): Promise<PasswordResetToken> {
    const prt = this.repo.create(data);
    return this.repo.save(prt);
  }

  async markUsed(token: string): Promise<void> {
    await this.repo.update({ token }, { used_at: new Date() });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.repo.delete({ user_id: userId });
  }
}
