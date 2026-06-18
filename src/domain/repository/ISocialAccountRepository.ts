import { SocialAccount, SocialProvider } from '../entity/SocialAccount';

export interface ISocialAccountRepository {
  findByProviderAndId(provider: SocialProvider, providerId: string): Promise<SocialAccount | null>;
  findByUserId(userId: string): Promise<SocialAccount[]>;
  create(data: Partial<SocialAccount>): Promise<SocialAccount>;
  update(id: string, data: Partial<SocialAccount>): Promise<SocialAccount>;
}
