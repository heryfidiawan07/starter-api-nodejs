import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { config } from './config/config';
import { createDataSource } from './database/datasource';
import { seed } from './database/seeder';
import { UserRepository } from './infrastructure/repository/UserRepository';
import { RoleRepository } from './infrastructure/repository/RoleRepository';
import { PermissionRepository } from './infrastructure/repository/PermissionRepository';
import { SocialAccountRepository } from './infrastructure/repository/SocialAccountRepository';
import { RefreshTokenRepository } from './infrastructure/repository/RefreshTokenRepository';
import { PasswordResetTokenRepository } from './infrastructure/repository/PasswordResetTokenRepository';
import { Mailer } from './pkg/email/email';
import { AuthService } from './service/AuthService';
import { UserService } from './service/UserService';
import { RoleService } from './service/RoleService';
import { PermissionService } from './service/PermissionService';
import { AuthHandler } from './handler/AuthHandler';
import { UserHandler } from './handler/UserHandler';
import { RoleHandler } from './handler/RoleHandler';
import { PermissionHandler } from './handler/PermissionHandler';
import { setupRouter } from './router/router';

async function main(): Promise<void> {
  const ds = await createDataSource(config);
  await seed(ds);

  // Repositories
  const userRepo = new UserRepository(ds);
  const roleRepo = new RoleRepository(ds);
  const permRepo = new PermissionRepository(ds);
  const socialRepo = new SocialAccountRepository(ds);
  const refreshRepo = new RefreshTokenRepository(ds);
  const resetRepo = new PasswordResetTokenRepository(ds);

  // Mailer
  const mailer = new Mailer(
    config.mail.host, config.mail.port, config.mail.user,
    config.mail.pass, config.mail.from, config.mail.fromName,
  );

  // Services
  const authSvc = new AuthService(userRepo, refreshRepo, resetRepo, socialRepo, mailer, config);
  const userSvc = new UserService(userRepo, config);
  const roleSvc = new RoleService(roleRepo, permRepo, userRepo);
  const permSvc = new PermissionService(permRepo);

  // Handlers
  const authHandler = new AuthHandler(authSvc);
  const userHandler = new UserHandler(userSvc);
  const roleHandler = new RoleHandler(roleSvc);
  const permHandler = new PermissionHandler(permSvc);

  // Express app
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/', (_req, res) => res.json({ message: 'Starter API — Node.js' }));

  setupRouter(app, config, userRepo, authHandler, userHandler, roleHandler, permHandler);

  const port = parseInt(config.app.port, 10);
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
