import { Response } from 'express';
import { CreateRoleSchema, UpdateRoleSchema } from '../domain/usecase/IRoleUsecase';
import { IRoleUsecase } from '../domain/usecase/IRoleUsecase';
import { AuthRequest } from '../middleware/auth';
import { ERR_ROLE_IN_USE, ERR_ROLE_NAME_TAKEN, ERR_ROLE_NOT_FOUND } from '../service/RoleService';
import * as res from '../pkg/response/response';
import { paginationSchema, validate } from '../pkg/validator/validator';

export class RoleHandler {
  constructor(private roleUsecase: IRoleUsecase) {}

  index = async (req: AuthRequest, resp: Response): Promise<void> => {
    const { data } = validate(paginationSchema, req.query);
    const [roles, total] = await this.roleUsecase.findAll({
      search: data?.search,
      page: data?.page ?? 1,
      perPage: data?.per_page ?? 10,
    });

    const page = data?.page ?? 1;
    const perPage = data?.per_page ?? 10;
    res.okWithMeta(resp, 'roles retrieved', roles, {
      page,
      per_page: perPage,
      total,
      total_page: Math.ceil(total / perPage),
    });
  };

  show = async (req: AuthRequest, resp: Response): Promise<void> => {
    try {
      const role = await this.roleUsecase.findById(req.params['id']!);
      res.ok(resp, 'role retrieved', role);
    } catch {
      res.notFound(resp, 'role not found');
    }
  };

  store = async (req: AuthRequest, resp: Response): Promise<void> => {
    const { data, errors } = validate(CreateRoleSchema, req.body);
    if (errors) { res.unprocessable(resp, 'validation failed', errors); return; }

    try {
      const role = await this.roleUsecase.create(data!);
      res.created(resp, 'role created', role);
    } catch (e) {
      if (e === ERR_ROLE_NAME_TAKEN) { res.badRequest(resp, (e as Error).message); return; }
      res.serverError(resp, 'failed to create role');
    }
  };

  update = async (req: AuthRequest, resp: Response): Promise<void> => {
    const { data, errors } = validate(UpdateRoleSchema, req.body);
    if (errors) { res.unprocessable(resp, 'validation failed', errors); return; }

    try {
      const role = await this.roleUsecase.update(req.params['id']!, data!);
      res.ok(resp, 'role updated', role);
    } catch (e) {
      if (e === ERR_ROLE_NOT_FOUND) { res.notFound(resp, 'role not found'); return; }
      if (e === ERR_ROLE_NAME_TAKEN) { res.badRequest(resp, (e as Error).message); return; }
      res.serverError(resp, 'failed to update role');
    }
  };

  destroy = async (req: AuthRequest, resp: Response): Promise<void> => {
    try {
      await this.roleUsecase.delete(req.params['id']!);
      res.ok(resp, 'role deleted');
    } catch (e) {
      if (e === ERR_ROLE_NOT_FOUND) { res.notFound(resp, 'role not found'); return; }
      if (e === ERR_ROLE_IN_USE) { res.badRequest(resp, (e as Error).message); return; }
      res.serverError(resp, 'failed to delete role');
    }
  };
}
