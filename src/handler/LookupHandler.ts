import { Response } from 'express';
import { IPermissionRepository } from '../domain/repository/IPermissionRepository';
import { IRoleRepository } from '../domain/repository/IRoleRepository';
import { AuthRequest } from '../middleware/auth';
import * as res from '../pkg/response/response';

export class LookupHandler {
  constructor(
    private roleRepo: IRoleRepository,
    private permRepo: IPermissionRepository,
  ) {}

  roles = async (_req: AuthRequest, resp: Response): Promise<void> => {
    try {
      const [roles] = await this.roleRepo.findAll({ page: 1, perPage: 9999 });
      const data = roles.map((r) => ({ id: r.id, name: r.name }));
      res.ok(resp, 'roles retrieved', data);
    } catch {
      res.serverError(resp, 'failed to retrieve roles');
    }
  };

  permissions = async (_req: AuthRequest, resp: Response): Promise<void> => {
    try {
      const permissions = await this.permRepo.findAll();
      res.ok(resp, 'permissions retrieved', permissions);
    } catch {
      res.serverError(resp, 'failed to retrieve permissions');
    }
  };
}
