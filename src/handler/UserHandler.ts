import { Response } from 'express';
import { CreateUserSchema, UpdateProfileSchema, UpdateUserSchema } from '../domain/usecase/IUserUsecase';
import { IUserUsecase } from '../domain/usecase/IUserUsecase';
import { AuthRequest } from '../middleware/auth';
import { ERR_USER_EMAIL_TAKEN, ERR_USER_NOT_FOUND, ERR_USER_USERNAME_TAKEN } from '../service/UserService';
import * as res from '../pkg/response/response';
import { paginationSchema, validate } from '../pkg/validator/validator';

export class UserHandler {
  constructor(private userUsecase: IUserUsecase) {}

  index = async (req: AuthRequest, resp: Response): Promise<void> => {
    const { data } = validate(paginationSchema, req.query);
    const [users, total] = await this.userUsecase.findAll({
      search: data?.search,
      page: data?.page ?? 1,
      perPage: data?.per_page ?? 10,
    });

    const page = data?.page ?? 1;
    const perPage = data?.per_page ?? 10;
    res.okWithMeta(resp, 'users retrieved', users, {
      page,
      per_page: perPage,
      total,
      total_page: Math.ceil(total / perPage),
    });
  };

  show = async (req: AuthRequest, resp: Response): Promise<void> => {
    try {
      const user = await this.userUsecase.findById(req.params['id']!);
      res.ok(resp, 'user retrieved', user);
    } catch {
      res.notFound(resp, 'user not found');
    }
  };

  store = async (req: AuthRequest, resp: Response): Promise<void> => {
    const { data, errors } = validate(CreateUserSchema, req.body);
    if (errors) { res.unprocessable(resp, 'validation failed', errors); return; }

    try {
      const user = await this.userUsecase.create(data!);
      res.created(resp, 'user created', user);
    } catch (e) {
      if (e === ERR_USER_EMAIL_TAKEN || e === ERR_USER_USERNAME_TAKEN) { res.badRequest(resp, (e as Error).message); return; }
      res.serverError(resp, 'failed to create user');
    }
  };

  update = async (req: AuthRequest, resp: Response): Promise<void> => {
    const { data, errors } = validate(UpdateUserSchema, req.body);
    if (errors) { res.unprocessable(resp, 'validation failed', errors); return; }

    try {
      const user = await this.userUsecase.update(req.params['id']!, data!);
      res.ok(resp, 'user updated', user);
    } catch (e) {
      if (e === ERR_USER_NOT_FOUND) { res.notFound(resp, 'user not found'); return; }
      res.serverError(resp, 'failed to update user');
    }
  };

  destroy = async (req: AuthRequest, resp: Response): Promise<void> => {
    try {
      await this.userUsecase.delete(req.params['id']!);
      res.ok(resp, 'user deleted');
    } catch (e) {
      if (e === ERR_USER_NOT_FOUND) { res.notFound(resp, 'user not found'); return; }
      res.serverError(resp, 'failed to delete user');
    }
  };

  updateProfile = async (req: AuthRequest, resp: Response): Promise<void> => {
    const { data, errors } = validate(UpdateProfileSchema, req.body);
    if (errors) { res.unprocessable(resp, 'validation failed', errors); return; }

    try {
      const user = await this.userUsecase.updateProfile(req.userId!, data!);
      res.ok(resp, 'profile updated', user);
    } catch (e) {
      if (e === ERR_USER_USERNAME_TAKEN) { res.badRequest(resp, (e as Error).message); return; }
      res.serverError(resp, 'failed to update profile');
    }
  };

  updatePhoto = async (req: AuthRequest, resp: Response): Promise<void> => {
    const file = req.file;
    if (!file) { res.badRequest(resp, 'photo file is required'); return; }

    try {
      const user = await this.userUsecase.updatePhoto(req.userId!, file.buffer, file.mimetype, file.originalname);
      res.ok(resp, 'photo updated', user);
    } catch (e) {
      res.badRequest(resp, (e as Error).message);
    }
  };
}
