import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayHistoryService } from './play-history.service';
import { PlayHistoryController } from './play-history.controller';
import { PlayHistory } from '../entities/play-history.entity';
import { User } from '../entities/user.entity';
import { Track } from '../entities/track.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlayHistory, User, Track])],
  controllers: [PlayHistoryController],
  providers: [PlayHistoryService],
  exports: [PlayHistoryService],
})
export class PlayHistoryModule {}


