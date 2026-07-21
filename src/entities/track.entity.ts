import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Review } from './review.entity';
import { Favorite } from './favorite.entity';
import { Purchase } from './purchase.entity';

@Entity('tracks')
export class Track {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'producer_id' })
  @Index()
  producerId: number;

  @Column({ name: 'category_id', nullable: true })
  @Index()
  categoryId: number;

  @Column({ type: 'int', nullable: true })
  @Index()
  bpm: number;

  @Column({ nullable: true })
  @Index()
  key: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @Index()
  price: number;

  @Column({ name: 'file_url' })
  fileUrl: string;

  @Column({ name: 'preview_url', nullable: true })
  previewUrl: string;

  @Column({ name: 'cover_url', nullable: true })
  coverUrl: string;

  @Column('text', { array: true, nullable: true })
  tags: string[];

  @Column({ name: 'is_public', default: true })
  @Index()
  isPublic: boolean;

  @Column({ name: 'views_count', default: 0 })
  viewsCount: number;

  @Column({ name: 'play_count', default: 0 })
  playCount: number;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.tracks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'producer_id' })
  producer: User;

  @ManyToOne(() => Category, (category) => category.tracks, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => Review, (review) => review.track)
  reviews: Review[];

  @OneToMany(() => Favorite, (favorite) => favorite.track)
  favorites: Favorite[];

  @OneToMany(() => Purchase, (purchase) => purchase.track)
  purchases: Purchase[];
}
