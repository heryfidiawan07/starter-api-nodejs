import dotenv from 'dotenv';
dotenv.config();

const get = (key: string, fallback = ''): string => process.env[key] ?? fallback;
const getInt = (key: string, fallback: number): number => parseInt(process.env[key] ?? String(fallback), 10);
const getBool = (key: string, fallback: boolean): boolean => {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v.toLowerCase() === 'true';
};

export const config = {
  app: {
    env: get('APP_ENV', 'development'),
    port: get('APP_PORT', '8080'),
    url: get('APP_URL', 'http://localhost:8080'),
  },
  db: {
    driver: get('DB_DRIVER', 'mysql'),
    host: get('DB_HOST', '127.0.0.1'),
    port: get('DB_PORT', '3306'),
    user: get('DB_USER', 'root'),
    pass: get('DB_PASS', ''),
    name: get('DB_NAME', 'starter_db'),
    sslMode: get('DB_SSLMODE', 'disable'),
  },
  jwt: {
    secret: get('JWT_SECRET', 'default-secret'),
    accessExpire: getInt('JWT_ACCESS_EXPIRE', 15),
    refreshExpire: getInt('JWT_REFRESH_EXPIRE', 10080),
  },
  mail: {
    host: get('MAIL_HOST', ''),
    port: getInt('MAIL_PORT', 587),
    user: get('MAIL_USER', ''),
    pass: get('MAIL_PASS', ''),
    from: get('MAIL_FROM', ''),
    fromName: get('MAIL_FROM_NAME', 'Starter API'),
  },
  google: {
    clientId: get('GOOGLE_CLIENT_ID', ''),
    clientSecret: get('GOOGLE_CLIENT_SECRET', ''),
    redirectUrl: get('GOOGLE_REDIRECT_URL', ''),
  },
  facebook: {
    clientId: get('FACEBOOK_CLIENT_ID', ''),
    clientSecret: get('FACEBOOK_CLIENT_SECRET', ''),
    redirectUrl: get('FACEBOOK_REDIRECT_URL', ''),
  },
  storage: {
    path: get('STORAGE_PATH', './storage/photos'),
    url: get('STORAGE_URL', 'http://localhost:8080/storage/photos'),
  },
  emailVerificationRequired: getBool('EMAIL_VERIFICATION_REQUIRED', true),
  resetTokenExpire: getInt('RESET_TOKEN_EXPIRE', 60),
};

export type Config = typeof config;
