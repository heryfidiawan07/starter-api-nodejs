import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Config } from '../config/config';
import { Permission } from '../domain/entity/Permission';
import { Role } from '../domain/entity/Role';
import { User } from '../domain/entity/User';
import { SocialAccount } from '../domain/entity/SocialAccount';
import { RefreshToken } from '../domain/entity/RefreshToken';
import { PasswordResetToken } from '../domain/entity/PasswordResetToken';

const entities = [Permission, Role, User, SocialAccount, RefreshToken, PasswordResetToken];

function buildOptions(cfg: Config): DataSourceOptions {
  const base = {
    entities,
    synchronize: true,
    logging: cfg.app.env === 'development',
  };

  switch (cfg.db.driver) {
    case 'mysql':
      return {
        ...base,
        type: 'mysql',
        host: cfg.db.host,
        port: parseInt(cfg.db.port, 10),
        username: cfg.db.user,
        password: cfg.db.pass,
        database: cfg.db.name,
        charset: 'utf8mb4',
      };
    case 'postgres':
      return {
        ...base,
        type: 'postgres',
        host: cfg.db.host,
        port: parseInt(cfg.db.port, 10),
        username: cfg.db.user,
        password: cfg.db.pass,
        database: cfg.db.name,
        ssl: cfg.db.sslMode !== 'disable' ? { rejectUnauthorized: false } : false,
      };
    case 'sqlserver':
      return {
        ...base,
        type: 'mssql',
        host: cfg.db.host,
        port: parseInt(cfg.db.port, 10),
        username: cfg.db.user,
        password: cfg.db.pass,
        database: cfg.db.name,
        options: { encrypt: false },
      };
    case 'sqlite':
    default:
      return {
        ...base,
        type: 'sqlite',
        database: `${cfg.db.name}.db`,
      };
  }
}

export async function createDataSource(cfg: Config): Promise<DataSource> {
  const ds = new DataSource(buildOptions(cfg));
  await ds.initialize();
  console.log(`Connected to ${cfg.db.driver} database`);
  return ds;
}
