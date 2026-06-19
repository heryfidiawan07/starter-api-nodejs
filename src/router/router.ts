import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { Config } from '../config/config';
import { AuthHandler } from '../handler/AuthHandler';
import { LookupHandler } from '../handler/LookupHandler';
import { PermissionHandler } from '../handler/PermissionHandler';
import { RoleHandler } from '../handler/RoleHandler';
import { UserHandler } from '../handler/UserHandler';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { IUserRepository } from '../domain/repository/IUserRepository';
import * as res from '../pkg/response/response';

const upload = multer({ storage: multer.memoryStorage() });

export function setupRouter(
  app: express.Application,
  cfg: Config,
  userRepo: IUserRepository,
  authHandler: AuthHandler,
  userHandler: UserHandler,
  roleHandler: RoleHandler,
  permHandler: PermissionHandler,
  lookupHandler: LookupHandler,
): void {
  app.use('/storage/photos', express.static(path.resolve(cfg.storage.path)));

  const api = Router();
  app.use('/api/v1', api);

  // Public config
  api.get('/config', (_req: Request, resp: Response) => {
    res.ok(resp, 'Config retrieved', {
      google_client_id: cfg.google.clientId,
      facebook_app_id: cfg.facebook.clientId,
    });
  });

  // Public auth
  const auth = Router();
  api.use('/auth', auth);
  auth.post('/register', authHandler.register);
  auth.post('/login', authHandler.login);
  auth.post('/refresh-token', authHandler.refreshToken);
  auth.post('/forgot-password', authHandler.forgotPassword);
  auth.post('/reset-password', authHandler.resetPassword);
  auth.get('/verify-email', authHandler.verifyEmail);
  auth.post('/oauth/google', authHandler.googleAuth);
  auth.post('/oauth/facebook', authHandler.facebookAuth);

  // Protected auth
  const authProtected = Router();
  authProtected.use(authMiddleware);
  api.use('/auth', authProtected);
  authProtected.get('/me', authHandler.me);
  authProtected.post('/logout', authHandler.logout);
  authProtected.post('/revoke-token', authHandler.revokeToken);
  authProtected.put('/change-password', authHandler.changePassword);

  // Profile
  const profile = Router();
  profile.use(authMiddleware);
  api.use('/profile', profile);
  profile.put('/', userHandler.updateProfile);
  profile.post('/photo', upload.single('photo'), userHandler.updatePhoto);

  // Users
  const users = Router();
  users.use(authMiddleware);
  api.use('/users', users);
  users.get('/', requirePermission('user:index', userRepo), userHandler.index);
  users.post('/', requirePermission('user:create', userRepo), userHandler.store);
  users.get('/:id', requirePermission('user:index', userRepo), userHandler.show);
  users.put('/:id', requirePermission('user:edit', userRepo), userHandler.update);
  users.delete('/:id', requirePermission('user:delete', userRepo), userHandler.destroy);

  // Roles
  const roles = Router();
  roles.use(authMiddleware);
  api.use('/roles', roles);
  roles.get('/', requirePermission('role:index', userRepo), roleHandler.index);
  roles.post('/', requirePermission('role:create', userRepo), roleHandler.store);
  roles.get('/:id', requirePermission('role:index', userRepo), roleHandler.show);
  roles.put('/:id', requirePermission('role:edit', userRepo), roleHandler.update);
  roles.delete('/:id', requirePermission('role:delete', userRepo), roleHandler.destroy);

  // Permissions
  const permissions = Router();
  permissions.use(authMiddleware);
  api.use('/permissions', permissions);
  permissions.get('/', permHandler.index);
  permissions.get('/tree', permHandler.tree);
  permissions.get('/role/:role_id', permHandler.byRole);

  // Lookup
  const lookup = Router();
  lookup.use(authMiddleware);
  api.use('/lookup', lookup);
  lookup.get('/roles', lookupHandler.roles);
  lookup.get('/permissions', lookupHandler.permissions);
}
