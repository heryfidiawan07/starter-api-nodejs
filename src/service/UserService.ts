import { Config } from '../config/config';
import { User } from '../domain/entity/User';
import { IUserRepository, UserFilter } from '../domain/repository/IUserRepository';
import { CreateUserDto, IUserUsecase, UpdateProfileDto, UpdateUserDto } from '../domain/usecase/IUserUsecase';
import * as hashPkg from '../pkg/hash/hash';
import * as uploadPkg from '../pkg/upload/upload';

export class UserError extends Error {}
export const ERR_USER_NOT_FOUND = new UserError('user not found');
export const ERR_USER_EMAIL_TAKEN = new UserError('email already taken');
export const ERR_USER_USERNAME_TAKEN = new UserError('username already taken');

export class UserService implements IUserUsecase {
  constructor(
    private userRepo: IUserRepository,
    private cfg: Config,
  ) {}

  private withPhotoUrl(user: User): User {
    if (user.photo && !user.photo.startsWith('http')) {
      user.photo = uploadPkg.buildPhotoUrl(this.cfg.storage.url, user.photo);
    }
    return user;
  }

  async findAll(filter: UserFilter): Promise<[User[], number]> {
    const [users, total] = await this.userRepo.findAll(filter);
    return [users.map(u => this.withPhotoUrl(u)), total];
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) throw ERR_USER_NOT_FOUND;
    return this.withPhotoUrl(user);
  }

  async create(dto: CreateUserDto): Promise<User> {
    if (await this.userRepo.findByEmail(dto.email)) throw ERR_USER_EMAIL_TAKEN;
    if (await this.userRepo.findByUsername(dto.username)) throw ERR_USER_USERNAME_TAKEN;

    const hashed = await hashPkg.make(dto.password);
    const user = await this.userRepo.create({
      username: dto.username,
      name: dto.name,
      email: dto.email,
      password: hashed,
      role_id: dto.role_id ?? null,
      is_active: dto.is_active ?? true,
    });
    return this.withPhotoUrl(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) throw ERR_USER_NOT_FOUND;

    const data: Partial<User> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.role_id !== undefined) data.role_id = dto.role_id ?? null;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;

    const updated = await this.userRepo.update(id, data);
    return this.withPhotoUrl(updated);
  }

  async delete(id: string): Promise<void> {
    const user = await this.userRepo.findById(id);
    if (!user) throw ERR_USER_NOT_FOUND;
    await this.userRepo.delete(id);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw ERR_USER_NOT_FOUND;

    const data: Partial<User> = {};
    if (dto.name) data.name = dto.name;
    if (dto.username && dto.username !== user.username) {
      if (await this.userRepo.findByUsername(dto.username)) throw ERR_USER_USERNAME_TAKEN;
      data.username = dto.username;
    }

    const updated = await this.userRepo.update(userId, data);
    return this.withPhotoUrl(updated);
  }

  async updatePhoto(userId: string, buffer: Buffer, mimetype: string, originalname: string): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw ERR_USER_NOT_FOUND;

    if (user.photo) {
      uploadPkg.deletePhoto(this.cfg.storage.path, user.photo);
    }

    const filename = uploadPkg.savePhoto(buffer, mimetype, originalname, this.cfg.storage.path);
    const updated = await this.userRepo.update(userId, { photo: filename });
    return this.withPhotoUrl(updated);
  }
}
