import { Role } from '../entity/Role';

export interface RoleFilter {
  search?: string;
  page: number;
  perPage: number;
}

export interface IRoleRepository {
  findAll(filter: RoleFilter): Promise<[Role[], number]>;
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  create(data: Partial<Role>): Promise<Role>;
  update(id: string, data: Partial<Role>): Promise<Role>;
  delete(id: string): Promise<void>;
  syncPermissions(roleId: string, permissionIds: string[]): Promise<void>;
}
