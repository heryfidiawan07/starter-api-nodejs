import crypto from 'crypto';
import axios from 'axios';
import { Config } from '../config/config';
import { User } from '../domain/entity/User';
import { IPasswordResetTokenRepository } from '../domain/repository/IPasswordResetTokenRepository';
import { IRefreshTokenRepository } from '../domain/repository/IRefreshTokenRepository';
import { ISocialAccountRepository } from '../domain/repository/ISocialAccountRepository';
import { IUserRepository } from '../domain/repository/IUserRepository';
import {
  AuthResponse, ChangePasswordDto, ForgotPasswordDto,
  IAuthUsecase, LoginDto, RegisterDto, ResetPasswordDto, SocialAuthDto,
} from '../domain/usecase/IAuthUsecase';
import { Mailer } from '../pkg/email/email';
import * as hashPkg from '../pkg/hash/hash';
import * as jwtPkg from '../pkg/jwt/jwt';

export class AuthError extends Error {}
export const ERR_INVALID_CREDENTIALS = new AuthError('invalid email or password');
export const ERR_EMAIL_TAKEN = new AuthError('email already taken');
export const ERR_USERNAME_TAKEN = new AuthError('username already taken');
export const ERR_INVALID_TOKEN = new AuthError('invalid or expired token');
export const ERR_EMAIL_NOT_VERIFIED = new AuthError('email not verified, please check your inbox');
export const ERR_ACCOUNT_INACTIVE = new AuthError('account is inactive');
export const ERR_WRONG_PASSWORD = new AuthError('current password is incorrect');
export const ERR_SOCIAL_NO_EMAIL = new AuthError('could not retrieve email from social provider');
export const ERR_USER_NOT_FOUND = new AuthError('user not found');

export class AuthService implements IAuthUsecase {
  constructor(
    private userRepo: IUserRepository,
    private refreshRepo: IRefreshTokenRepository,
    private resetRepo: IPasswordResetTokenRepository,
    private socialRepo: ISocialAccountRepository,
    private mailer: Mailer,
    private cfg: Config,
  ) {}

  async register(dto: RegisterDto): Promise<User> {
    if (await this.userRepo.findByEmail(dto.email)) throw ERR_EMAIL_TAKEN;
    if (await this.userRepo.findByUsername(dto.username)) throw ERR_USERNAME_TAKEN;

    const hashed = await hashPkg.make(dto.password);
    const user = await this.userRepo.create({
      username: dto.username,
      name: dto.name,
      email: dto.email,
      password: hashed,
      status: true,
    });

    if (this.cfg.emailVerificationRequired) {
      this.sendVerificationEmail(user).catch(() => null);
    } else {
      await this.userRepo.update(user.id, { verified_at: new Date() });
      user.verified_at = new Date();
    }

    return user;
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) throw ERR_INVALID_CREDENTIALS;
    if (!user.status) throw ERR_ACCOUNT_INACTIVE;
    if (!user.password || !(await hashPkg.check(dto.password, user.password))) throw ERR_INVALID_CREDENTIALS;
    if (this.cfg.emailVerificationRequired && !user.verified_at) throw ERR_EMAIL_NOT_VERIFIED;

    return this.generateTokenPair(user);
  }

  async logout(userId: string): Promise<void> {
    await this.refreshRepo.revokeAllByUserId(userId);
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    const rt = await this.refreshRepo.findByToken(token);
    if (!rt || !rt.isValid()) throw ERR_INVALID_TOKEN;

    const user = await this.userRepo.findById(rt.user_id);
    if (!user) throw ERR_USER_NOT_FOUND;

    await this.refreshRepo.revoke(token);
    return this.generateTokenPair(user);
  }

  async revokeToken(refreshToken: string): Promise<void> {
    const rt = await this.refreshRepo.findByToken(refreshToken);
    if (!rt || !rt.isValid()) throw ERR_INVALID_TOKEN;
    await this.refreshRepo.revoke(refreshToken);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) return; // don't reveal

    await this.resetRepo.deleteByUserId(user.id);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.cfg.resetTokenExpire * 60 * 1000);

    await this.resetRepo.create({ user_id: user.id, token, expires_at: expiresAt, used_at: null });

    const resetUrl = `${this.cfg.app.url}/reset-password?token=${token}`;
    this.mailer.sendPasswordReset(user.email, user.name, resetUrl, this.cfg.resetTokenExpire).catch(() => null);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const prt = await this.resetRepo.findByToken(dto.token);
    if (!prt || !prt.isValid()) throw ERR_INVALID_TOKEN;

    const hashed = await hashPkg.make(dto.password);
    await this.userRepo.update(prt.user_id, { password: hashed });
    await this.resetRepo.markUsed(dto.token);
    await this.refreshRepo.revokeAllByUserId(prt.user_id);
  }

  async verifyEmail(token: string): Promise<void> {
    const prt = await this.resetRepo.findByToken(token);
    if (!prt || !prt.isValid()) throw ERR_INVALID_TOKEN;

    await this.userRepo.update(prt.user_id, { verified_at: new Date() });
    await this.resetRepo.markUsed(token);
  }

  async googleAuth(dto: SocialAuthDto): Promise<AuthResponse> {
    const { data } = await axios.get<{ id: string; email: string; name: string }>(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${dto.access_token}`,
    );
    if (!data.email) throw ERR_SOCIAL_NO_EMAIL;
    return this.handleSocialLogin('google', data.id, data.email, data.name);
  }

  async facebookAuth(dto: SocialAuthDto): Promise<AuthResponse> {
    const { data } = await axios.get<{ id: string; email: string; name: string }>(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${dto.access_token}`,
    );
    if (!data.email) throw ERR_SOCIAL_NO_EMAIL;
    return this.handleSocialLogin('facebook', data.id, data.email, data.name);
  }

  async getMe(userId: string): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw ERR_USER_NOT_FOUND;
    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepo.findByEmail(
      (await this.userRepo.findById(userId))?.email ?? '',
    );
    if (!user) throw ERR_USER_NOT_FOUND;
    if (!user.password || !(await hashPkg.check(dto.old_password, user.password))) throw ERR_WRONG_PASSWORD;

    const hashed = await hashPkg.make(dto.new_password);
    await this.userRepo.update(userId, { password: hashed });
  }

  private async generateTokenPair(user: User): Promise<AuthResponse> {
    const accessToken = jwtPkg.generateAccessToken(user.id, user.is_root, this.cfg.jwt.secret, this.cfg.jwt.accessExpire);
    const refreshTokenStr = jwtPkg.generateRefreshToken(user.id, this.cfg.jwt.secret, this.cfg.jwt.refreshExpire);

    const expiresAt = new Date(Date.now() + this.cfg.jwt.refreshExpire * 60 * 1000);
    await this.refreshRepo.create({ user_id: user.id, token: refreshTokenStr, expires_at: expiresAt, revoked_at: null });

    return {
      access_token: accessToken,
      refresh_token: refreshTokenStr,
      token_type: 'Bearer',
      expires_in: this.cfg.jwt.accessExpire * 60,
      user,
    };
  }

  private async handleSocialLogin(provider: 'google' | 'facebook', providerId: string, email: string, name: string): Promise<AuthResponse> {
    let account = await this.socialRepo.findByProviderAndId(provider, providerId);
    let user: User | null;

    if (!account) {
      user = await this.userRepo.findByEmail(email);
      if (!user) {
        const username = email.split('@')[0] + '_' + Date.now().toString().slice(-4);
        user = await this.userRepo.create({
          username,
          name,
          email,
          status: true,
          verified_at: new Date(),
        });
      }
      await this.socialRepo.create({ user_id: user.id, provider, provider_id: providerId, provider_email: email });
    } else {
      user = await this.userRepo.findById(account.user_id);
      if (!user) throw ERR_USER_NOT_FOUND;
    }

    if (!user.status) throw ERR_ACCOUNT_INACTIVE;
    return this.generateTokenPair(user);
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.resetRepo.create({ user_id: user.id, token, expires_at: expiresAt, used_at: null });

    const verifyUrl = `${this.cfg.app.url}/api/v1/auth/verify-email?token=${token}`;
    await this.mailer.sendVerification(user.email, user.name, verifyUrl);
  }
}
