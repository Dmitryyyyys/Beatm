import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review } from '../entities/review.entity';
import { Track } from '../entities/track.entity';
import { CommentLike } from '../entities/comment-like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Track, CommentLike])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}


