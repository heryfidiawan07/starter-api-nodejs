import { NextFunction, Request, Response } from 'express';
import { config } from '../config/config';
import { JwtExpiredError, JwtInvalidError, parseToken } from '../pkg/jwt/jwt';
import { unauthorized } from '../pkg/response/response';

export interface AuthRequest extends Request {
  userId?: string;
  isRoot?: boolean;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    unauthorized(res, 'missing or invalid authorization header');
    return;
  }

  const token = header.slice(7);
  try {
    const claims = parseToken(token, config.jwt.secret);
    req.userId = claims.user_id;
    req.isRoot = claims.is_root;
    next();
  } catch (err) {
    if (err instanceof JwtExpiredError) {
      unauthorized(res, 'token expired');
    } else if (err instanceof JwtInvalidError) {
      unauthorized(res, 'invalid token');
    } else {
      unauthorized(res, 'unauthorized');
    }
  }
};
