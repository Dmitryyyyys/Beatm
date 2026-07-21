import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Track } from '../entities/track.entity';
import { Favorite } from '../entities/favorite.entity';
import { SavedTrack } from '../entities/saved-track.entity';
import { Review } from '../entities/review.entity';
import { PlayHistory } from '../entities/play-history.entity';
import { Purchase } from '../entities/purchase.entity';
import { Subscription } from '../entities/subscription.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Track,
      Favorite,
      SavedTrack,
      Review,
      PlayHistory,
      Purchase,
      Subscription,
      User,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}

