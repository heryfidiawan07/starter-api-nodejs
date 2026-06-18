import { Permission } from '../entity/Permission';

export interface IPermissionUsecase {
  findAll(): Promise<Permission[]>;
  findTree(): Promise<Permission[]>;
  findByRoleId(roleId: string): Promise<Permission[]>;
}
