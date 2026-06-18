import { DataSource } from 'typeorm';
import { SocialAccount, SocialProvider } from '../../domain/entity/SocialAccount';
import { ISocialAccountRepository } from '../../domain/repository/ISocialAccountRepository';

export class SocialAccountRepository implements ISocialAccountRepository {
  private repo = this.ds.getRepository(SocialAccount);

  constructor(private readonly ds: DataSource) {}

  async findByProviderAndId(provider: SocialProvider, providerId: string): Promise<SocialAccount | null> {
    return this.repo.findOne({ where: { provider, provider_id: providerId } });
  }

  async findByUserId(userId: string): Promise<SocialAccount[]> {
    return this.repo.find({ where: { user_id: userId } });
  }

  async create(data: Partial<SocialAccount>): Promise<SocialAccount> {
    const account = this.repo.create(data);
    return this.repo.save(account);
  }

  async update(id: string, data: Partial<SocialAccount>): Promise<SocialAccount> {
    await this.repo.update(id, data as Partial<SocialAccount>);
    return (await this.repo.findOneBy({ id }))!;
  }
}
