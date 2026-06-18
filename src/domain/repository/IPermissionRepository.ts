import { Permission } from '../entity/Permission';

export interface IPermissionRepository {
  findAll(): Promise<Permission[]>;
  findById(id: string): Promise<Permission | null>;
  findByName(name: string): Promise<Permission | null>;
  findTree(): Promise<Permission[]>;
  findByRoleId(roleId: string): Promise<Permission[]>;
}
