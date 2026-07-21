import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from '../entities/favorite.entity';
import { Track } from '../entities/track.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
    @InjectRepository(Track)
    private tracksRepository: Repository<Track>,
  ) {}

  async addToFavorites(trackId: number, user: User): Promise<Favorite> {
    // Check if track exists
    const track = await this.tracksRepository.findOne({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    // Check if already in favorites
    const existing = await this.favoritesRepository.findOne({
      where: { trackId, userId: user.id },
    });

    if (existing) {
      throw new ConflictException('Track already in favorites');
    }

    const favorite = this.favoritesRepository.create({
      trackId,
      userId: user.id,
    });

    return this.favoritesRepository.save(favorite);
  }

  async removeFromFavorites(trackId: number, user: User): Promise<void> {
    const favorite = await this.favoritesRepository.findOne({
      where: { trackId, userId: user.id },
    });

    if (!favorite) {
      throw new NotFoundException('Track not in favorites');
    }

    await this.favoritesRepository.remove(favorite);
  }

  async getUserFavorites(userId: number): Promise<Favorite[]> {
    return this.favoritesRepository.find({
      where: { userId },
      relations: ['track', 'track.producer', 'track.category'],
      order: { addedAt: 'DESC' },
    });
  }

  async isFavorite(trackId: number, userId: number): Promise<boolean> {
    const favorite = await this.favoritesRepository.findOne({
      where: { trackId, userId },
    });
    return !!favorite;
  }

  async getFavoriteCount(trackId: number): Promise<number> {
    return this.favoritesRepository.count({
      where: { trackId },
    });
  }
}


