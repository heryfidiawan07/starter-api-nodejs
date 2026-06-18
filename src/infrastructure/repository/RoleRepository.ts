import { DataSource, Like } from 'typeorm';
import { Role } from '../../domain/entity/Role';
import { Permission } from '../../domain/entity/Permission';
import { IRoleRepository, RoleFilter } from '../../domain/repository/IRoleRepository';

export class RoleRepository implements IRoleRepository {
  private repo = this.ds.getRepository(Role);
  private permRepo = this.ds.getRepository(Permission);

  constructor(private readonly ds: DataSource) {}

  async findAll(filter: RoleFilter): Promise<[Role[], number]> {
    const where = filter.search
      ? [{ name: Like(`%${filter.search}%`) }, { description: Like(`%${filter.search}%`) }]
      : {};

    return this.repo.findAndCount({
      where,
      relations: ['permissions'],
      skip: (filter.page - 1) * filter.perPage,
      take: filter.perPage,
    });
  }

  async findById(id: string): Promise<Role | null> {
    return this.repo.findOne({ where: { id }, relations: ['permissions'] });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.repo.findOne({ where: { name } });
  }

  async create(data: Partial<Role>): Promise<Role> {
    const role = this.repo.create(data);
    return this.repo.save(role);
  }

  async update(id: string, data: Partial<Role>): Promise<Role> {
    await this.repo.update(id, data as Partial<Role>);
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async syncPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    const role = await this.repo.findOne({ where: { id: roleId }, relations: ['permissions'] });
    if (!role) return;

    if (permissionIds.length === 0) {
      role.permissions = [];
    } else {
      const permissions = await this.permRepo.findByIds(permissionIds);
      role.permissions = permissions;
    }

    await this.repo.save(role);
  }
}
