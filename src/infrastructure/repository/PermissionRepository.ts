import { DataSource } from 'typeorm';
import { Permission } from '../../domain/entity/Permission';
import { IPermissionRepository } from '../../domain/repository/IPermissionRepository';

export class PermissionRepository implements IPermissionRepository {
  private repo = this.ds.getRepository(Permission);

  constructor(private readonly ds: DataSource) {}

  async findAll(): Promise<Permission[]> {
    return this.repo.find({ order: { order: 'ASC' } });
  }

  async findById(id: string): Promise<Permission | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.repo.findOne({ where: { name } });
  }

  async findTree(): Promise<Permission[]> {
    const all = await this.repo.find({ order: { order: 'ASC' } });
    return buildTree(all);
  }

  async findByRoleId(roleId: string): Promise<Permission[]> {
    return this.ds
      .getRepository(Permission)
      .createQueryBuilder('p')
      .innerJoin('role_permissions', 'rp', 'rp.permission_id = p.id')
      .where('rp.role_id = :roleId', { roleId })
      .orderBy('p.order', 'ASC')
      .getMany();
  }
}

function buildTree(all: Permission[]): Permission[] {
  const map = new Map<string, Permission>();
  all.forEach((p) => {
    p.children = [];
    map.set(p.id, p);
  });

  const roots: Permission[] = [];
  all.forEach((p) => {
    if (!p.parent_id) {
      roots.push(p);
    } else {
      const parent = map.get(p.parent_id);
      if (parent) parent.children.push(p);
    }
  });

  return roots;
}
