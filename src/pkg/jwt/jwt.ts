import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export interface JwtClaims {
  user_id: string;
  is_root: boolean;
  jti: string;
}

export class JwtError extends Error {}
export class JwtExpiredError extends JwtError {
  constructor() { super('token expired'); }
}
export class JwtInvalidError extends JwtError {
  constructor() { super('invalid token'); }
}

export const generateAccessToken = (userId: string, isRoot: boolean, secret: string, expireMinutes: number): string => {
  const payload: JwtClaims = { user_id: userId, is_root: isRoot, jti: uuidv4() };
  const opts: SignOptions = { expiresIn: expireMinutes * 60 };
  return jwt.sign(payload, secret, opts);
};

export const generateRefreshToken = (userId: string, secret: string, expireMinutes: number): string => {
  const payload = { user_id: userId, jti: uuidv4() };
  const opts: SignOptions = { expiresIn: expireMinutes * 60 };
  return jwt.sign(payload, secret, opts);
};

export const parseToken = (token: string, secret: string): JwtClaims => {
  try {
    const decoded = jwt.verify(token, secret) as JwtClaims;
    return decoded;
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) throw new JwtExpiredError();
    throw new JwtInvalidError();
  }
};
