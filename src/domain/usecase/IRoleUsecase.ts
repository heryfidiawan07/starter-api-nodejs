import { z } from 'zod';
import { Role } from '../entity/Role';
import { RoleFilter } from '../repository/IRoleRepository';

export const CreateRoleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().default(''),
  permission_ids: z.array(z.string().uuid()).default([]),
});

export const UpdateRoleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  permission_ids: z.array(z.string().uuid()).optional(),
});

export type CreateRoleDto = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleDto = z.infer<typeof UpdateRoleSchema>;

export interface IRoleUsecase {
  findAll(filter: RoleFilter): Promise<[Role[], number]>;
  findById(id: string): Promise<Role>;
  create(dto: CreateRoleDto): Promise<Role>;
  update(id: string, dto: UpdateRoleDto): Promise<Role>;
  delete(id: string): Promise<void>;
}
