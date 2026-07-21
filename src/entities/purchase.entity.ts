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

@Entity('purchases')
@Unique(['userId', 'trackId'])
export class Purchase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  @Column({ name: 'track_id' })
  @Index()
  trackId: number;

  @Column({ name: 'purchase_price', type: 'decimal', precision: 10, scale: 2 })
  purchasePrice: number;

  @CreateDateColumn({ name: 'purchased_at' })
  @Index()
  purchasedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.purchases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Track, (track) => track.purchases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_id' })
  track: Track;
}


