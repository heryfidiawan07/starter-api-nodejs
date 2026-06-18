import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Permission } from '../domain/entity/Permission';
import { User } from '../domain/entity/User';
import { make } from '../pkg/hash/hash';

export async function seed(ds: DataSource): Promise<void> {
  console.log('Running database seeders...');
  await seedPermissions(ds);
  await seedRootUser(ds);
  console.log('Seeders completed successfully');
}

async function seedPermissions(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Permission);
  const count = await repo.count();
  if (count > 0) return;

  const mainCat = repo.create({ id: uuidv4(), name: 'main', label: 'Main', type: 'category', order: 1 });
  const settingsCat = repo.create({ id: uuidv4(), name: 'settings', label: 'Settings', type: 'category', order: 2 });
  await repo.save([mainCat, settingsCat]);

  const dashboard = repo.create({
    id: uuidv4(), parent_id: mainCat.id,
    name: 'dashboard:index', label: 'Dashboard', type: 'menu',
    route: '/dashboard', icon: 'layout-dashboard', order: 1,
  });
  await repo.save(dashboard);

  const adminMenu = repo.create({
    id: uuidv4(), parent_id: settingsCat.id,
    name: 'administrator', label: 'Administrator', type: 'menu',
    route: null, icon: 'shield', order: 1,
  });
  await repo.save(adminMenu);

  const userMenu = repo.create({
    id: uuidv4(), parent_id: adminMenu.id,
    name: 'user:index', label: 'User', type: 'menu',
    route: '/admin/users', icon: 'users', order: 1,
  });
  await repo.save(userMenu);

  const userActions = [
    repo.create({ id: uuidv4(), parent_id: userMenu.id, name: 'user:create', label: 'Create User', type: 'action', order: 1 }),
    repo.create({ id: uuidv4(), parent_id: userMenu.id, name: 'user:edit', label: 'Edit User', type: 'action', order: 2 }),
    repo.create({ id: uuidv4(), parent_id: userMenu.id, name: 'user:delete', label: 'Delete User', type: 'action', order: 3 }),
  ];
  await repo.save(userActions);

  const roleMenu = repo.create({
    id: uuidv4(), parent_id: adminMenu.id,
    name: 'role:index', label: 'Role', type: 'menu',
    route: '/admin/roles', icon: 'key', order: 2,
  });
  await repo.save(roleMenu);

  const roleActions = [
    repo.create({ id: uuidv4(), parent_id: roleMenu.id, name: 'role:create', label: 'Create Role', type: 'action', order: 1 }),
    repo.create({ id: uuidv4(), parent_id: roleMenu.id, name: 'role:edit', label: 'Edit Role', type: 'action', order: 2 }),
    repo.create({ id: uuidv4(), parent_id: roleMenu.id, name: 'role:delete', label: 'Delete Role', type: 'action', order: 3 }),
  ];
  await repo.save(roleActions);

  const permissionMenu = repo.create({
    id: uuidv4(), parent_id: adminMenu.id,
    name: 'permission:index', label: 'Permission', type: 'menu',
    route: '/admin/permissions', icon: 'lock', order: 3,
  });
  await repo.save(permissionMenu);
}

async function seedRootUser(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(User);
  const exists = await repo.findOne({ where: { is_root: true } });
  if (exists) return;

  const hashed = await make('password');
  const root = repo.create({
    username: 'root',
    name: 'Root Administrator',
    email: 'root@example.com',
    password: hashed,
    is_root: true,
    is_active: true,
    verified_at: new Date(),
  });
  await repo.save(root);
  console.log('Root user created: email=root@example.com password=password');
}
