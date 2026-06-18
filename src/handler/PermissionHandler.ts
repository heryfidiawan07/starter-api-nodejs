import { Response } from 'express';
import { IPermissionUsecase } from '../domain/usecase/IPermissionUsecase';
import { AuthRequest } from '../middleware/auth';
import * as res from '../pkg/response/response';

export class PermissionHandler {
  constructor(private permissionUsecase: IPermissionUsecase) {}

  index = async (_req: AuthRequest, resp: Response): Promise<void> => {
    try {
      const permissions = await this.permissionUsecase.findAll();
      res.ok(resp, 'permissions retrieved', permissions);
    } catch {
      res.serverError(resp, 'failed to retrieve permissions');
    }
  };

  tree = async (_req: AuthRequest, resp: Response): Promise<void> => {
    try {
      const tree = await this.permissionUsecase.findTree();
      res.ok(resp, 'permission tree retrieved', tree);
    } catch {
      res.serverError(resp, 'failed to retrieve permission tree');
    }
  };

  byRole = async (req: AuthRequest, resp: Response): Promise<void> => {
    const roleId = req.params['role_id'];
    if (!roleId) { res.badRequest(resp, 'role_id is required'); return; }

    try {
      const permissions = await this.permissionUsecase.findByRoleId(roleId);
      res.ok(resp, 'permissions retrieved', permissions);
    } catch {
      res.serverError(resp, 'failed to retrieve permissions');
    }
  };
}
