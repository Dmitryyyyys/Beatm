import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, Between, MoreThanOrEqual } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Review } from '../entities/review.entity';
import { Favorite } from '../entities/favorite.entity';
import { SavedTrack } from '../entities/saved-track.entity';
import { Purchase } from '../entities/purchase.entity';
import { PlayHistory } from '../entities/play-history.entity';
import { Track } from '../entities/track.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private profilesRepository: Repository<UserProfile>,
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
    @InjectRepository(SavedTrack)
    private savedTracksRepository: Repository<SavedTrack>,
    @InjectRepository(Purchase)
    private purchasesRepository: Repository<Purchase>,
    @InjectRepository(PlayHistory)
    private playHistoryRepository: Repository<PlayHistory>,
    @InjectRepository(Track)
    private tracksRepository: Repository<Track>,
  ) {}

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async findByDisplayName(displayName: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { displayName },
      relations: ['profile'],
    });
  }

  async findOneSafe(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['profile'],
    });
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    isBlocked?: boolean;
  }): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options?.search) {
      where.displayName = ILike(`%${options.search}%`);
    }

    if (options?.role) {
      where.role = options.role;
    }

    if (options?.isBlocked !== undefined) {
      where.isBlocked = options.isBlocked;
    }

    const [users, total] = await this.usersRepository.findAndCount({
      where,
      relations: ['profile'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      users,
      total,
      page,
      limit,
    };
  }

  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfile> {
    let profile = await this.profilesRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      profile = this.profilesRepository.create({
        userId,
        ...updateProfileDto,
      });
    } else {
      Object.assign(profile, updateProfileDto);
    }

    return this.profilesRepository.save(profile);
  }

  async getProfile(userId: number): Promise<UserProfile | null> {
    return this.profilesRepository.findOne({
      where: { userId },
    });
  }

  async blockUser(blockUserDto: BlockUserDto): Promise<User> {
    const user = await this.findOne(blockUserDto.userId);
    user.isBlocked = blockUserDto.isBlocked;
    return this.usersRepository.save(user);
  }

  async updateUserRole(updateRoleDto: UpdateRoleDto): Promise<User> {
    const user = await this.findOne(updateRoleDto.userId);
    user.role = updateRoleDto.role;
    return this.usersRepository.save(user);
  }

  async getUserDetails(userId: number) {
    const user = await this.findOne(userId);
    const profile = await this.getProfile(userId);

    // Get reviews/comments
    const reviews = await this.reviewsRepository.find({
      where: { userId },
      relations: ['track', 'user'],
      order: { createdAt: 'DESC' },
    });

    // Get statistics
    const now = new Date();
    const days = 30;
    const chartData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const [comments, favorites, saves, purchases, plays] = await Promise.all([
        this.reviewsRepository.count({
          where: { userId, createdAt: Between(dayStart, dayEnd) },
        }),
        this.favoritesRepository
          .createQueryBuilder('favorite')
          .where('favorite.userId = :userId', { userId })
          .andWhere('favorite.addedAt >= :dayStart AND favorite.addedAt < :dayEnd', { dayStart, dayEnd })
          .getCount(),
        this.savedTracksRepository
          .createQueryBuilder('saved')
          .where('saved.userId = :userId', { userId })
          .andWhere('saved.savedAt >= :dayStart AND saved.savedAt < :dayEnd', { dayStart, dayEnd })
          .getCount(),
        this.purchasesRepository.count({
          where: { userId, purchasedAt: Between(dayStart, dayEnd) },
        }),
        this.playHistoryRepository.count({
          where: { userId, playedAt: Between(dayStart, dayEnd) },
        }),
      ]);

      chartData.push({
        date: date.toISOString().split('T')[0],
        comments,
        favorites,
        saves,
        purchases,
        plays,
      });
    }

    // Total statistics
    const totalComments = await this.reviewsRepository.count({ where: { userId } });
    const totalFavorites = await this.favoritesRepository.count({ where: { userId } });
    const totalSaves = await this.savedTracksRepository.count({ where: { userId } });
    const totalPurchases = await this.purchasesRepository.count({ where: { userId } });
    const totalPlays = await this.playHistoryRepository.count({ where: { userId } });
    
    // If user is producer, get tracks count and tracks list
    let totalTracks = 0;
    let producerTracks: Track[] = [];
    if (user.role === UserRole.PRODUCER) {
      totalTracks = await this.tracksRepository.count({ where: { producerId: userId } });
      producerTracks = await this.tracksRepository.find({
        where: { producerId: userId },
        relations: ['category'],
        order: { createdAt: 'DESC' },
      });
    }

    return {
      user: {
        ...user,
        profile: profile || null,
      },
      reviews,
      tracks: producerTracks,
      statistics: {
        totalComments,
        totalFavorites,
        totalSaves,
        totalPurchases,
        totalPlays,
        totalTracks,
      },
      charts: {
        activity: chartData,
      },
    };
  }
}


