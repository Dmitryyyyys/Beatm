import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { User } from './user.entity';

@Entity('subscriptions')
@Index(['subscriberId', 'subscribedToId'], { unique: true })
@Check(`"subscriber_id" != "subscribed_to_id"`)
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'subscriber_id' })
  subscriberId: number;

  @Column({ name: 'subscribed_to_id' })
  subscribedToId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriber_id' })
  subscriber: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscribed_to_id' })
  subscribedTo: User;
}

