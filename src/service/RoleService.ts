import { Role } from '../domain/entity/Role';
import { IPermissionRepository } from '../domain/repository/IPermissionRepository';
import { IRoleRepository, RoleFilter } from '../domain/repository/IRoleRepository';
import { IUserRepository } from '../domain/repository/IUserRepository';
import { CreateRoleDto, IRoleUsecase, UpdateRoleDto } from '../domain/usecase/IRoleUsecase';

export class RoleError extends Error {}
export const ERR_ROLE_NOT_FOUND = new RoleError('role not found');
export const ERR_ROLE_NAME_TAKEN = new RoleError('role name already taken');
export const ERR_ROLE_IN_USE = new RoleError('role is assigned to users and cannot be deleted');

export class RoleService implements IRoleUsecase {
  constructor(
    private roleRepo: IRoleRepository,
    private permRepo: IPermissionRepository,
    private userRepo: IUserRepository,
  ) {}

  async findAll(filter: RoleFilter): Promise<[Role[], number]> {
    return this.roleRepo.findAll(filter);
  }

  async findById(id: string): Promise<Role> {
    const role = await this.roleRepo.findById(id);
    if (!role) throw ERR_ROLE_NOT_FOUND;
    return role;
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    if (await this.roleRepo.findByName(dto.name)) throw ERR_ROLE_NAME_TAKEN;

    const role = await this.roleRepo.create({
      name: dto.name,
      description: dto.description || null,
    });

    if (dto.permission_ids?.length) {
      await this.roleRepo.syncPermissions(role.id, dto.permission_ids);
    }

    return (await this.roleRepo.findById(role.id))!;
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.roleRepo.findById(id);
    if (!role) throw ERR_ROLE_NOT_FOUND;

    const data: Partial<Role> = {};
    if (dto.name && dto.name !== role.name) {
      if (await this.roleRepo.findByName(dto.name)) throw ERR_ROLE_NAME_TAKEN;
      data.name = dto.name;
    }
    if (dto.description !== undefined) data.description = dto.description ?? null;

    if (Object.keys(data).length) await this.roleRepo.update(id, data);

    if (dto.permission_ids !== undefined) {
      await this.roleRepo.syncPermissions(id, dto.permission_ids);
    }

    return (await this.roleRepo.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    if (!(await this.roleRepo.findById(id))) throw ERR_ROLE_NOT_FOUND;

    const [users] = await this.userRepo.findAll({ page: 1, perPage: 1, roleId: id });
    if (users.length > 0) throw ERR_ROLE_IN_USE;

    await this.roleRepo.delete(id);
  }
}
