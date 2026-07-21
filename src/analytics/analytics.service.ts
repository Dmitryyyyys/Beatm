import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual, Between } from 'typeorm';
import { Track } from '../entities/track.entity';
import { Favorite } from '../entities/favorite.entity';
import { SavedTrack } from '../entities/saved-track.entity';
import { Review } from '../entities/review.entity';
import { PlayHistory } from '../entities/play-history.entity';
import { Purchase } from '../entities/purchase.entity';
import { Subscription } from '../entities/subscription.entity';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Track)
    private tracksRepository: Repository<Track>,
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
    @InjectRepository(SavedTrack)
    private savedTracksRepository: Repository<SavedTrack>,
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(PlayHistory)
    private playHistoryRepository: Repository<PlayHistory>,
    @InjectRepository(Purchase)
    private purchasesRepository: Repository<Purchase>,
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getProducerAnalytics(producerId: number) {
    // Get all producer's tracks
    const tracks = await this.tracksRepository.find({
      where: { producerId },
      select: ['id', 'title', 'viewsCount', 'playCount', 'createdAt'],
    });

    const trackIds = tracks.map((t) => t.id);

    if (trackIds.length === 0) {
      return {
        totalLikes: 0,
        totalViews: 0,
        totalPlays: 0,
        totalSaves: 0,
        totalComments: 0,
        totalDownloads: 0,
        totalSubscribers: 0,
        trackAnalytics: [],
        overview: {
          totalTracks: 0,
          averageLikesPerTrack: 0,
          averageViewsPerTrack: 0,
          averagePlaysPerTrack: 0,
          averageSavesPerTrack: 0,
          averageCommentsPerTrack: 0,
        },
      };
    }

    // Get total likes (favorites)
    const allLikes = await this.favoritesRepository.count({
      where: { trackId: In(trackIds) },
    });

    // Get total views from tracks
    const totalViews = tracks.reduce((sum, track) => sum + (track.viewsCount || 0), 0);

    // Get total plays from tracks
    const totalPlays = tracks.reduce((sum, track) => sum + (track.playCount || 0), 0);

    // Get total saves
    const totalSaves = await this.savedTracksRepository.count({
      where: { trackId: In(trackIds) },
    });

    // Get total comments
    const totalComments = await this.reviewsRepository.count({
      where: { trackId: In(trackIds), isVisible: true },
    });

    // Get total downloads (purchases)
    const totalDownloads = await this.purchasesRepository.count({
      where: { trackId: In(trackIds) },
    });

    // Get total subscribers
    const totalSubscribers = await this.subscriptionsRepository.count({
      where: { subscribedToId: producerId },
    });

    // Get per-track analytics
    const trackAnalytics = await Promise.all(
      tracks.map(async (track) => {
        const [likes, saves, comments, downloads] = await Promise.all([
          this.favoritesRepository.count({ where: { trackId: track.id } }),
          this.savedTracksRepository.count({ where: { trackId: track.id } }),
          this.reviewsRepository.count({ 
            where: { trackId: track.id, isVisible: true } 
          }),
          this.purchasesRepository.count({ where: { trackId: track.id } }),
        ]);

        return {
          trackId: track.id,
          trackTitle: track.title,
          likes,
          views: track.viewsCount || 0,
          plays: track.playCount || 0,
          saves,
          comments,
          downloads,
          createdAt: track.createdAt,
        };
      }),
    );

    const totalTracks = tracks.length;

    return {
      totalLikes: allLikes,
      totalViews,
      totalPlays,
      totalSaves,
      totalComments,
      totalDownloads,
      totalSubscribers,
      trackAnalytics,
      overview: {
        totalTracks,
        averageLikesPerTrack: totalTracks > 0 ? allLikes / totalTracks : 0,
        averageViewsPerTrack: totalTracks > 0 ? totalViews / totalTracks : 0,
        averagePlaysPerTrack: totalTracks > 0 ? totalPlays / totalTracks : 0,
        averageSavesPerTrack: totalTracks > 0 ? totalSaves / totalTracks : 0,
        averageCommentsPerTrack: totalTracks > 0 ? totalComments / totalTracks : 0,
      },
    };
  }

  async getAdminStatistics() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Новые пользователи
    const newUsersToday = await this.usersRepository.count({
      where: { createdAt: MoreThanOrEqual(todayStart) },
    });
    const newUsersWeek = await this.usersRepository.count({
      where: { createdAt: MoreThanOrEqual(weekAgo) },
    });

    // Новые треки
    const newTracksToday = await this.tracksRepository.count({
      where: { createdAt: MoreThanOrEqual(todayStart) },
    });
    const newTracksWeek = await this.tracksRepository.count({
      where: { createdAt: MoreThanOrEqual(weekAgo) },
    });

    // Общее количество треков
    const totalTracks = await this.tracksRepository.count();

    // Активные продюсеры (продюсеры с хотя бы одним треком)
    const activeProducers = await this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.tracks', 'track')
      .where('user.role = :role', { role: UserRole.PRODUCER })
      .select('COUNT(DISTINCT user.id)', 'count')
      .getRawOne();

    // Сумма покупок за месяц
    const monthlyPurchases = await this.purchasesRepository
      .createQueryBuilder('purchase')
      .select('COALESCE(SUM(purchase.purchasePrice), 0)', 'total')
      .where('purchase.purchasedAt >= :monthStart', { monthStart })
      .getRawOne();

    // Графики активности за последние 30 дней
    const days = 30;
    const chartData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const [plays, downloads, purchases, likes, comments, users] = await Promise.all([
        this.playHistoryRepository.count({
          where: { playedAt: Between(dayStart, dayEnd) },
        }),
        this.purchasesRepository.count({
          where: { purchasedAt: Between(dayStart, dayEnd) },
        }),
        this.purchasesRepository
          .createQueryBuilder('purchase')
          .select('COALESCE(SUM(purchase.purchasePrice), 0)', 'total')
          .where('purchase.purchasedAt >= :dayStart AND purchase.purchasedAt < :dayEnd', {
            dayStart,
            dayEnd,
          })
          .getRawOne(),
        this.favoritesRepository.count({
          where: { addedAt: Between(dayStart, dayEnd) },
        }),
        this.reviewsRepository.count({
          where: { createdAt: Between(dayStart, dayEnd), isVisible: true },
        }),
        this.usersRepository.count({
          where: { createdAt: Between(dayStart, dayEnd) },
        }),
      ]);

      chartData.push({
        date: date.toISOString().split('T')[0],
        plays,
        downloads,
        purchases: parseFloat(purchases.total || '0'),
        likes,
        comments,
        users,
      });
    }

    // Рост пользователей (кумулятивный)
    const userGrowthData = [];
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    // Общее количество пользователей до начала периода
    const usersBeforePeriod = await this.usersRepository.count({
      where: { createdAt: Between(new Date(0), periodStart) },
    });
    
    let cumulativeUsers = usersBeforePeriod;
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const newUsers = await this.usersRepository.count({
        where: { createdAt: Between(dayStart, dayEnd) },
      });
      cumulativeUsers += newUsers;

      userGrowthData.push({
        date: date.toISOString().split('T')[0],
        users: cumulativeUsers,
      });
    }

    return {
      stats: {
        newUsersToday,
        newUsersWeek,
        newTracksToday,
        newTracksWeek,
        totalTracks,
        activeProducers: parseInt(activeProducers?.count || '0', 10),
        monthlyRevenue: parseFloat(monthlyPurchases?.total || '0'),
      },
      charts: {
        activity: chartData,
        userGrowth: userGrowthData,
      },
    };
  }
}

