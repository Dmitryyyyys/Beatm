import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayHistory } from '../entities/play-history.entity';
import { Track } from '../entities/track.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class PlayHistoryService {
  constructor(
    @InjectRepository(PlayHistory)
    private playHistoryRepository: Repository<PlayHistory>,
    @InjectRepository(Track)
    private tracksRepository: Repository<Track>,
  ) {}

  async recordPlay(trackId: number, user: User): Promise<PlayHistory> {
    // Check if track exists
    const track = await this.tracksRepository.findOne({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    // Check if there's an existing entry for this user and track
    // If exists, update the played_at timestamp; otherwise create new
    const existing = await this.playHistoryRepository.findOne({
      where: { trackId, userId: user.id },
    });

    if (existing) {
      // Update existing entry with new play time
      existing.playedAt = new Date();
      return this.playHistoryRepository.save(existing);
    }

    // Create new entry
    const playHistory = this.playHistoryRepository.create({
      trackId,
      userId: user.id,
    });

    return this.playHistoryRepository.save(playHistory);
  }

  async getUserPlayHistory(userId: number, limit?: number) {
    const queryBuilder = this.playHistoryRepository
      .createQueryBuilder('ph')
      .leftJoinAndSelect('ph.track', 'track')
      .leftJoinAndSelect('track.producer', 'producer')
      .leftJoinAndSelect('track.category', 'category')
      .where('ph.userId = :userId', { userId })
      .orderBy('ph.playedAt', 'DESC');

    if (limit) {
      queryBuilder.limit(limit);
    }

    const playHistory = await queryBuilder.getMany();

    return playHistory.map((ph) => ({
      id: ph.id,
      userId: ph.userId,
      trackId: ph.trackId,
      playedAt: ph.playedAt,
      track: ph.track,
    }));
  }

  async clearPlayHistory(userId: number): Promise<void> {
    await this.playHistoryRepository.delete({ userId });
  }

  async removeFromHistory(trackId: number, userId: number): Promise<void> {
    const playHistory = await this.playHistoryRepository.findOne({
      where: { trackId, userId },
    });

    if (!playHistory) {
      throw new NotFoundException('Track not in play history');
    }

    await this.playHistoryRepository.remove(playHistory);
  }
}


