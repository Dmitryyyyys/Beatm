import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TracksService } from './tracks.service';
import { TracksController } from './tracks.controller';
import { Track } from '../entities/track.entity';
import { PlayHistory } from '../entities/play-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Track, PlayHistory])],
  controllers: [TracksController],
  providers: [TracksService],
  exports: [TracksService],
})
export class TracksModule {}


