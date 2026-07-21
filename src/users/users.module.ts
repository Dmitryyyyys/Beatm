import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { Review } from '../entities/review.entity';
import { Favorite } from '../entities/favorite.entity';
import { SavedTrack } from '../entities/saved-track.entity';
import { Purchase } from '../entities/purchase.entity';
import { PlayHistory } from '../entities/play-history.entity';
import { Track } from '../entities/track.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      Review,
      Favorite,
      SavedTrack,
      Purchase,
      PlayHistory,
      Track,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}


