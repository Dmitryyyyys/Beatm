import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';
import { Track } from './track.entity';
import { Review } from './review.entity';
import { Favorite } from './favorite.entity';
import { Purchase } from './purchase.entity';

export enum UserRole {
  ADMIN = 'admin',
  PRODUCER = 'producer',
  USER = 'user',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'display_name', unique: true })
  displayName: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: UserRole.USER,
  })
  @Index()
  role: UserRole;

  @Column({ name: 'is_blocked', default: false })
  @Index()
  isBlocked: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
  profile: UserProfile;

  @OneToMany(() => Track, (track) => track.producer)
  tracks: Track[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];

  @OneToMany(() => Purchase, (purchase) => purchase.user)
  purchases: Purchase[];
}


