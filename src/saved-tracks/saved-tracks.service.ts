import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedTrack } from '../entities/saved-track.entity';
import { Track } from '../entities/track.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class SavedTracksService {
  constructor(
    @InjectRepository(SavedTrack)
    private savedTracksRepository: Repository<SavedTrack>,
    @InjectRepository(Track)
    private tracksRepository: Repository<Track>,
  ) {}

  async saveTrack(trackId: number, user: User): Promise<SavedTrack> {
    // Check if track exists
    const track = await this.tracksRepository.findOne({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    // Check if already saved
    const existing = await this.savedTracksRepository.findOne({
      where: { trackId, userId: user.id },
    });

    if (existing) {
      throw new ConflictException('Track already saved');
    }

    const savedTrack = this.savedTracksRepository.create({
      trackId,
      userId: user.id,
    });

    return this.savedTracksRepository.save(savedTrack);
  }

  async unsaveTrack(trackId: number, user: User): Promise<void> {
    const savedTrack = await this.savedTracksRepository.findOne({
      where: { trackId, userId: user.id },
    });

    if (!savedTrack) {
      throw new NotFoundException('Track not in saved');
    }

    await this.savedTracksRepository.remove(savedTrack);
  }

  async getUserSavedTracks(userId: number) {
    const savedTracks = await this.savedTracksRepository.find({
      where: { userId },
      relations: ['track', 'track.producer', 'track.category'],
      order: { savedAt: 'DESC' },
    });

    return savedTracks.map((st) => ({
      id: st.id,
      userId: st.userId,
      trackId: st.trackId,
      savedAt: st.savedAt,
      track: st.track,
    }));
  }

  async isSaved(trackId: number, userId: number): Promise<boolean> {
    const savedTrack = await this.savedTracksRepository.findOne({
      where: { trackId, userId },
    });
    return !!savedTrack;
  }

  async getSavedCount(trackId: number): Promise<number> {
    return this.savedTracksRepository.count({
      where: { trackId },
    });
  }
}

