import { z } from 'zod';
import { User } from '../entity/User';
import { UserFilter } from '../repository/IUserRepository';

export const CreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role_id: z.string().uuid().optional().nullable(),
  status: z.boolean().optional(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role_id: z.string().uuid().optional().nullable(),
  status: z.boolean().optional(),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  username: z.string().min(3).max(50).optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

export interface IUserUsecase {
  findAll(filter: UserFilter): Promise<[User[], number]>;
  findById(id: string): Promise<User>;
  create(dto: CreateUserDto): Promise<User>;
  update(id: string, dto: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
  updateProfile(userId: string, dto: UpdateProfileDto): Promise<User>;
  updatePhoto(userId: string, buffer: Buffer, mimetype: string, originalname: string): Promise<User>;
}
