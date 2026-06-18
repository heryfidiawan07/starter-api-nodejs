import { Permission } from '../domain/entity/Permission';
import { IPermissionRepository } from '../domain/repository/IPermissionRepository';
import { IPermissionUsecase } from '../domain/usecase/IPermissionUsecase';

export class PermissionService implements IPermissionUsecase {
  constructor(private permRepo: IPermissionRepository) {}

  async findAll(): Promise<Permission[]> {
    return this.permRepo.findAll();
  }

  async findTree(): Promise<Permission[]> {
    return this.permRepo.findTree();
  }

  async findByRoleId(roleId: string): Promise<Permission[]> {
    return this.permRepo.findByRoleId(roleId);
  }
}
