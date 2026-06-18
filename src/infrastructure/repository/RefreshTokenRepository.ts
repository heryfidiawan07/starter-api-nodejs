import { DataSource, IsNull, LessThan } from 'typeorm';
import { RefreshToken } from '../../domain/entity/RefreshToken';
import { IRefreshTokenRepository } from '../../domain/repository/IRefreshTokenRepository';

export class RefreshTokenRepository implements IRefreshTokenRepository {
  private repo = this.ds.getRepository(RefreshToken);

  constructor(private readonly ds: DataSource) {}

  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.repo.findOne({ where: { token } });
  }

  async create(data: Partial<RefreshToken>): Promise<RefreshToken> {
    const rt = this.repo.create(data);
    return this.repo.save(rt);
  }

  async revoke(token: string): Promise<void> {
    await this.repo.update({ token }, { revoked_at: new Date() });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.repo.update(
      { user_id: userId, revoked_at: IsNull() },
      { revoked_at: new Date() },
    );
  }

  async deleteExpired(): Promise<void> {
    await this.repo.delete({ expires_at: LessThan(new Date()) });
  }
}
