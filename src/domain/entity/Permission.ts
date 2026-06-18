import {
  Column, CreateDateColumn, DeleteDateColumn, Entity,
  JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export type PermissionType = 'category' | 'menu' | 'action';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'parent_id' })
  parent_id: string | null;

  @ManyToOne(() => Permission, (p) => p.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Permission | null;

  @OneToMany(() => Permission, (p) => p.parent)
  children: Permission[];

  @Column({ unique: true })
  name: string;

  @Column()
  label: string;

  @Column({ type: 'varchar', length: 20 })
  type: PermissionType;

  @Column({ nullable: true })
  route: string | null;

  @Column({ nullable: true })
  icon: string | null;

  @Column({ default: 0, name: 'order' })
  order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
