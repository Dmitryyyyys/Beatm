import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Track } from './track.entity';

@Entity('favorites')
@Unique(['userId', 'trackId'])
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  @Column({ name: 'track_id' })
  @Index()
  trackId: number;

  @CreateDateColumn({ name: 'added_at' })
  @Index()
  addedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Track, (track) => track.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_id' })
  track: Track;
}


