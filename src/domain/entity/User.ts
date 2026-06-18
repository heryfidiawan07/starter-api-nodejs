import {
  Column, CreateDateColumn, DeleteDateColumn, Entity,
  JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { Role } from './Role';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  password: string | null;

  @Column({ nullable: true })
  photo: string | null;

  @Column({ nullable: true })
  verified_at: Date | null;

  @Column({ default: false })
  is_root: boolean;

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'role_id' })
  role_id: string | null;

  @ManyToOne(() => Role, { nullable: true, eager: false })
  @JoinColumn({ name: 'role_id' })
  role: Role | null;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
