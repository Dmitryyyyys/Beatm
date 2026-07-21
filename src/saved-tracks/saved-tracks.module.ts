import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedTracksService } from './saved-tracks.service';
import { SavedTracksController } from './saved-tracks.controller';
import { SavedTrack } from '../entities/saved-track.entity';
import { User } from '../entities/user.entity';
import { Track } from '../entities/track.entity';
import { UserProfile } from '../entities/user-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SavedTrack, User, Track, UserProfile])],
  controllers: [SavedTracksController],
  providers: [SavedTracksService],
  exports: [SavedTracksService],
})
export class SavedTracksModule {}

