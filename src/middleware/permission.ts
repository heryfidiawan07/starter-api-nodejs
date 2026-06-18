import { NextFunction, Response } from 'express';
import { IUserRepository } from '../domain/repository/IUserRepository';
import { forbidden } from '../pkg/response/response';
import { AuthRequest } from './auth';

export const requirePermission = (permissionName: string, userRepo: IUserRepository) =>
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (req.isRoot) {
      next();
      return;
    }

    const userId = req.userId;
    if (!userId) {
      forbidden(res, 'access denied');
      return;
    }

    const user = await userRepo.findById(userId);
    if (!user?.role?.permissions) {
      forbidden(res, 'access denied: no role assigned');
      return;
    }

    const hasPermission = user.role.permissions.some((p) => p.name === permissionName);
    if (!hasPermission) {
      forbidden(res, 'access denied: insufficient permissions');
      return;
    }

    next();
  };
