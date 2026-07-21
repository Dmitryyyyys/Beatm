import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase } from '../entities/purchase.entity';
import { Track } from '../entities/track.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private purchasesRepository: Repository<Purchase>,
    @InjectRepository(Track)
    private tracksRepository: Repository<Track>,
  ) {}

  async purchaseTrack(trackId: number, user: User): Promise<Purchase> {
    // Check if track exists
    const track = await this.tracksRepository.findOne({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    // Prevent users from purchasing their own tracks
    if (track.producerId === user.id) {
      throw new BadRequestException('Cannot purchase your own track');
    }

    // Check if already purchased
    const existing = await this.purchasesRepository.findOne({
      where: { trackId, userId: user.id },
    });

    if (existing) {
      throw new ConflictException('Track already purchased');
    }

    // Validate price (in real app, would check payment here)
    if (track.price <= 0) {
      throw new BadRequestException('Cannot purchase free track');
    }

    const purchase = this.purchasesRepository.create({
      trackId,
      userId: user.id,
      purchasePrice: track.price,
    });

    return this.purchasesRepository.save(purchase);
  }

  async getUserPurchases(userId: number): Promise<Purchase[]> {
    return this.purchasesRepository.find({
      where: { userId },
      relations: ['track', 'track.producer', 'track.category'],
      order: { purchasedAt: 'DESC' },
    });
  }

  async isPurchased(trackId: number, userId: number): Promise<boolean> {
    const purchase = await this.purchasesRepository.findOne({
      where: { trackId, userId },
    });
    return !!purchase;
  }

  async getUserPurchasedTrackIds(userId: number): Promise<number[]> {
    const purchases = await this.purchasesRepository.find({
      where: { userId },
      select: ['trackId'],
    });
    return purchases.map((p) => p.trackId);
  }
}


