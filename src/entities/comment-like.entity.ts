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
import { Review } from './review.entity';

@Entity('comment_likes')
@Unique(['reviewId', 'userId'])
export class CommentLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'review_id' })
  @Index()
  reviewId: number;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Review, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: Review;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

