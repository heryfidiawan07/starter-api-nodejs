import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ unique: true, type: 'text' })
  token: string;

  @Column()
  expires_at: Date;

  @Column({ nullable: true })
  used_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  isValid(): boolean {
    return this.used_at === null && new Date(this.expires_at) > new Date();
  }
}
