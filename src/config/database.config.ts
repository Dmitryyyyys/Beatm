import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { Category } from '../entities/category.entity';
import { Track } from '../entities/track.entity';
import { Review } from '../entities/review.entity';
import { Favorite } from '../entities/favorite.entity';
import { Purchase } from '../entities/purchase.entity';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { Subscription } from '../entities/subscription.entity';
import { SavedTrack } from '../entities/saved-track.entity';
import { PlayHistory } from '../entities/play-history.entity';
import { CommentLike } from '../entities/comment-like.entity';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'beatstore',
  entities: [User, UserProfile, Category, Track, Review, Favorite, Purchase, Conversation, Message, Subscription, SavedTrack, PlayHistory, CommentLike],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  extra: {
    connectionTimeoutMillis: 10000,
  },
});

