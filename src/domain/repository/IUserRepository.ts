import { User } from '../entity/User';

export interface UserFilter {
  search?: string;
  is_active?: boolean;
  roleId?: string;
  page: number;
  perPage: number;
}

export interface IUserRepository {
  findAll(filter: UserFilter): Promise<[User[], number]>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(user: Partial<User>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}
