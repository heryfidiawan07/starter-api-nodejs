import { z } from 'zod';
import { User } from '../entity/User';

export const RegisterSchema = z.object({
  username: z.string().min(3).max(50),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RefreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export const ChangePasswordSchema = z.object({
  old_password: z.string().min(1),
  new_password: z.string().min(8),
});

export const SocialAuthSchema = z.object({
  access_token: z.string().min(1),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
export type SocialAuthDto = z.infer<typeof SocialAuthSchema>;

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface IAuthUsecase {
  register(dto: RegisterDto): Promise<User>;
  login(dto: LoginDto): Promise<AuthResponse>;
  logout(userId: string): Promise<void>;
  refreshToken(token: string): Promise<AuthResponse>;
  revokeToken(refreshToken: string): Promise<void>;
  forgotPassword(dto: ForgotPasswordDto): Promise<void>;
  resetPassword(dto: ResetPasswordDto): Promise<void>;
  verifyEmail(token: string): Promise<void>;
  googleAuth(dto: SocialAuthDto): Promise<AuthResponse>;
  facebookAuth(dto: SocialAuthDto): Promise<AuthResponse>;
  getMe(userId: string): Promise<User>;
  changePassword(userId: string, dto: ChangePasswordDto): Promise<void>;
}
