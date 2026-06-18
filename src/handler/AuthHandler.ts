import { Response } from 'express';
import {
  ChangePasswordSchema, ForgotPasswordSchema, LoginSchema,
  RefreshTokenSchema, RegisterSchema, ResetPasswordSchema, SocialAuthSchema,
} from '../domain/usecase/IAuthUsecase';
import { IAuthUsecase } from '../domain/usecase/IAuthUsecase';
import { AuthRequest } from '../middleware/auth';
import {
  AuthError, ERR_ACCOUNT_INACTIVE, ERR_EMAIL_NOT_VERIFIED,
  ERR_EMAIL_TAKEN, ERR_INVALID_CREDENTIALS, ERR_INVALID_TOKEN, ERR_WRONG_PASSWORD, ERR_USERNAME_TAKEN,
} from '../service/AuthService';
import * as res from '../pkg/response/response';
import { validate } from '../pkg/validator/validator';

export class AuthHandler {
  constructor(private authUsecase: IAuthUsecase) {}

  register = async (req: AuthRequest, resp: Response): Promise<void> => {
    const { data, errors } = validate(RegisterSchema, req.body);
    if (errors) { res.unprocessable(resp, 'validation failed', errors); return; }

    try {
      const user = await this.authUsecase.register(data!);
      res.created(resp, 'registration successful, please verify your email', user);
    } catch (e) {
      if (e === ERR_EMAIL_TAKEN || e === ERR_USERNAME_TAKEN) { res.badRequest(resp, (e as Error).message); return; }
      res.serverError(resp, 'registration failed');
    }
  };

  login = async (req: AuthRequest, resp: Response): Promise<void> => {
    const { data, errors } = validate(LoginSchema, req.body);
    if (errors) { res.unprocessable(resp, 'validation failed', errors); return; }

    try {
      const result = await this.authUsecase.login(data!);
      res.ok(resp, 'login successful', result);
    } catch (e) {
      if (e === ERR_INVALID_CREDENTIALS || e === ERR_EMAIL_NOT_VERIFIED) { res.unauthorized(resp, (e as Error).message); return; }
      if (e === ERR_ACCOUNT_INACTIVE) { res.forbidden(resp, (e as Error).message); return; }
      res.serverError(resp, 'login failed');
    }
  };

  logout = async (req: AuthRequest, resp: Response): Promise<void> => {
    await this.authUsecase.logout(req.userId!);
    res.ok(resp, 'logout successful');
  };

  refreshToken = async (req: AuthRequest, resp: Response): Promise<void> => {
    const { data, errors } = validate(RefreshTokenSchema, req.body);
    if (errors) { res.unprocessable(resp, 'validation failed', errors); return; }

    try {
      const result = await this.authUsecase.refreshToken(data!.refresh_token);
      res.ok(resp, 'token refreshed', result);
    } catch {
      res.unauthorized(resp, 'invalid or expired refresh token');
    }
  };

  revokeToken = async (req: AuthRequest, resp: Response): Promise<void> => {
    const { data, errors } = validate(RefreshTokenSchema, req.body);
    if (errors) { res.unprocessable(resp, 'validation failed', errors); return; }

    try {
      await this.authUsecase.revokeToken(data!.refresh_token);
      res.ok(resp, 'token revoked');
    } catch {
      res.badRequest(resp, 'invalid token');
    }
  };

  forgotPassword = async (req: AuthRequest, resp: Response): Promise<void> => {
    const { data, errors } = validate(ForgotPasswordSchema, req.body);
    if (errors) { res.unprocessable(resp, 'validation failed', errors); return; }
    await this.authUsecase.forgotPassword(data!);
    res.ok(resp, 'if the email exists, a reset link has been sent');
  };

  resetPassword = async (req: AuthRequest, resp: Response): Promise<void> => {
    const { data, errors } = validate(ResetPasswordSchema, req.body);
    if (errors) { res.unprocessable(resp, 'validation failed', errors); return; }

    try {
      await this.authUsecase.resetPassword(data!);
      res.ok(resp, 'password reset successful');
    } catch {
      res.badRequest(resp, 'invalid or expired reset token');
    }
  };

  verifyEmail = async (req: AuthRequest, resp: Response): Promise<void> => {
    const token = req.query['token'] as string;
    if (!token) { res.badRequest(resp, 'token is required'); return; }

    try {
      await this.authUsecase.verifyEmail(token);
      res.ok(resp, 'email verified successfully');
    } catch {
      res.badRequest(resp, 'invalid or expired verification token');
    }
  };

  googleAuth = async (req: AuthRequest, resp: Response): Promise<void> => {
    const { data, errors } = validate(SocialAuthSchema, req.body);
    if (errors) { res.unprocessable(resp, 'validation failed', errors); return; }

    try {
      const result = await this.authUsecase.googleAuth(data!);
      res.ok(resp, 'google login successful', result);
    } catch (e) {
      res.badRequest(resp, `google authentication failed: ${(e as Error).message}`);
    }
  };

  facebookAuth = async (req: AuthRequest, resp: Response): Promise<void> => {
    const { data, errors } = validate(SocialAuthSchema, req.body);
    if (errors) { res.unprocessable(resp, 'validation failed', errors); return; }

    try {
      const result = await this.authUsecase.facebookAuth(data!);
      res.ok(resp, 'facebook login successful', result);
    } catch (e) {
      res.badRequest(resp, `facebook authentication failed: ${(e as Error).message}`);
    }
  };

  me = async (req: AuthRequest, resp: Response): Promise<void> => {
    try {
      const user = await this.authUsecase.getMe(req.userId!);
      res.ok(resp, 'profile retrieved', user);
    } catch {
      res.notFound(resp, 'user not found');
    }
  };

  changePassword = async (req: AuthRequest, resp: Response): Promise<void> => {
    const { data, errors } = validate(ChangePasswordSchema, req.body);
    if (errors) { res.unprocessable(resp, 'validation failed', errors); return; }

    try {
      await this.authUsecase.changePassword(req.userId!, data!);
      res.ok(resp, 'password changed successfully');
    } catch (e) {
      if (e === ERR_WRONG_PASSWORD) { res.badRequest(resp, (e as Error).message); return; }
      res.serverError(resp, 'change password failed');
    }
  };
}
