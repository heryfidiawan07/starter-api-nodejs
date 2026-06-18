import { DataSource, Like } from 'typeorm';
import { User } from '../../domain/entity/User';
import { IUserRepository, UserFilter } from '../../domain/repository/IUserRepository';

export class UserRepository implements IUserRepository {
  private repo = this.ds.getRepository(User);

  constructor(private readonly ds: DataSource) {}

  async findAll(filter: UserFilter): Promise<[User[], number]> {
    const where: Record<string, unknown>[] = [];

    const buildWhere = () => {
      const base: Record<string, unknown> = {};
      if (filter.is_active !== undefined) base.is_active = filter.is_active;
      if (filter.roleId) base.role_id = filter.roleId;
      return base;
    };

    const baseWhere = buildWhere();

    if (filter.search) {
      const like = Like(`%${filter.search}%`);
      where.push({ ...baseWhere, username: like });
      where.push({ ...baseWhere, name: like });
      where.push({ ...baseWhere, email: like });
    } else {
      where.push(baseWhere);
    }

    return this.repo.findAndCount({
      where,
      relations: ['role'],
      skip: (filter.page - 1) * filter.perPage,
      take: filter.perPage,
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['role', 'role.permissions'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.repo.findOne({ where: { username } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.repo.update(id, data as Partial<User>);
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
