import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Track } from '../entities/track.entity';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { FilterTracksDto } from './dto/filter-tracks.dto';
import { User } from '../entities/user.entity';
import { PlayHistory } from '../entities/play-history.entity';

@Injectable()
export class TracksService implements OnModuleInit {
  constructor(
    @InjectRepository(Track)
    private tracksRepository: Repository<Track>,
    @InjectRepository(PlayHistory)
    private playHistoryRepository: Repository<PlayHistory>,
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    try {
      await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
      await this.dataSource.query(
        `CREATE INDEX IF NOT EXISTS idx_tracks_title_trgm ON tracks USING gin (title gin_trgm_ops)`,
      );
      await this.dataSource.query(
        `CREATE INDEX IF NOT EXISTS idx_tracks_tags_gin ON tracks USING gin (tags)`,
      );
    } catch (e) {
      // Non-critical: indexes may already exist or user lacks permission
    }
  }

  async create(createTrackDto: CreateTrackDto, producer: User): Promise<Track> {
    const track = this.tracksRepository.create({
      ...createTrackDto,
      producerId: producer.id,
    });

    return this.tracksRepository.save(track);
  }

  async findAll(filterDto: FilterTracksDto = {}) {
    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
      bpm,
      key,
      producerId,
      isPublic,
      page = 1,
      limit = 20,
      minBpm,
      maxBpm,
      freeOnly,
      sortBy,
    } = filterDto;

    const queryBuilder = this.tracksRepository
      .createQueryBuilder('track')
      .select([
        'track.id',
        'track.title',
        'track.description',
        'track.producerId',
        'track.categoryId',
        'track.bpm',
        'track.key',
        'track.price',
        'track.previewUrl',
        'track.coverUrl',
        'track.tags',
        'track.isPublic',
        'track.viewsCount',
        'track.playCount',
        'track.createdAt',
        'track.updatedAt',
      ])
      .leftJoin('track.producer', 'producer')
      .addSelect(['producer.id', 'producer.displayName'])
      .leftJoin('track.category', 'category')
      .addSelect(['category.id', 'category.name', 'category.slug']);

    if (search) {
      queryBuilder.andWhere(
        '(track.title ILIKE :search OR producer.displayName ILIKE :search OR EXISTS (SELECT 1 FROM unnest(track.tags) AS tag WHERE tag ILIKE :search))',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('track.categoryId = :categoryId', { categoryId });
    }

    if (minPrice !== undefined && maxPrice !== undefined) {
      queryBuilder.andWhere('track.price BETWEEN :minPrice AND :maxPrice', {
        minPrice,
        maxPrice,
      });
    } else if (minPrice !== undefined) {
      queryBuilder.andWhere('track.price >= :minPrice', { minPrice });
    } else if (maxPrice !== undefined) {
      queryBuilder.andWhere('track.price <= :maxPrice', { maxPrice });
    }

    if (bpm) {
      queryBuilder.andWhere('track.bpm = :bpm', { bpm });
    }

    if (minBpm !== undefined && maxBpm !== undefined) {
      queryBuilder.andWhere('track.bpm BETWEEN :minBpm AND :maxBpm', {
        minBpm,
        maxBpm,
      });
    } else if (minBpm !== undefined) {
      queryBuilder.andWhere('track.bpm >= :minBpm', { minBpm });
    } else if (maxBpm !== undefined) {
      queryBuilder.andWhere('track.bpm <= :maxBpm', { maxBpm });
    }

    if (freeOnly) {
      queryBuilder.andWhere('track.price = 0');
    }

    if (key) {
      queryBuilder.andWhere('track.key = :key', { key });
    }

    if (producerId) {
      queryBuilder.andWhere('track.producerId = :producerId', { producerId });
    }

    if (isPublic !== undefined) {
      queryBuilder.andWhere('track.isPublic = :isPublic', { isPublic });
    }

    // Sorting
    const sortByValue = sortBy || 'newest';
    switch (sortByValue) {
      case 'popularity':
        queryBuilder.orderBy('track.playCount', 'DESC').addOrderBy('track.viewsCount', 'DESC');
        break;
      case 'price':
        queryBuilder.orderBy('track.price', 'DESC');
        break;
      case 'priceAsc':
        queryBuilder.orderBy('track.price', 'ASC');
        break;
      case 'newest':
      default:
        queryBuilder.orderBy('track.createdAt', 'DESC');
        break;
    }

    const skip = (page - 1) * limit;

    const [tracks, total] = await Promise.all([
      queryBuilder.clone().skip(skip).take(limit).getMany(),
      queryBuilder.clone().getCount(),
    ]);

    return {
      tracks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Track> {
    const track = await this.tracksRepository.findOne({
      where: { id },
      relations: ['producer', 'category', 'reviews', 'reviews.user'],
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    return track;
  }

  async incrementViews(id: number, user?: User): Promise<void> {
    // Don't increment views for admin users
    if (user && user.role === 'admin') {
      return;
    }
    await this.tracksRepository.increment({ id }, 'viewsCount', 1);
  }

  async incrementPlayCount(id: number, user?: User): Promise<void> {
    // Don't increment play count for admin users
    if (user && user.role === 'admin') {
      return;
    }
    await this.tracksRepository.increment({ id }, 'playCount', 1);
  }

  async getPlayCount(id: number): Promise<number> {
    const track = await this.tracksRepository.findOne({
      where: { id },
      select: ['playCount'],
    });
    return track?.playCount || 0;
  }

  async findByProducer(producerId: number): Promise<Track[]> {
    return this.tracksRepository.find({
      where: { producerId },
      relations: ['category', 'reviews'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: number,
    updateTrackDto: UpdateTrackDto,
    user: User,
  ): Promise<Track> {
    const track = await this.findOne(id);

    // Only producer or admin can update
    if (track.producerId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('You can only update your own tracks');
    }

    // Explicitly update each field to ensure undefined values are handled correctly
    if (updateTrackDto.title !== undefined) {
      track.title = updateTrackDto.title;
    }
    if (updateTrackDto.description !== undefined) {
      track.description = updateTrackDto.description;
    }
    // Handle categoryId explicitly - can be number or null to remove category
    if (updateTrackDto.categoryId !== undefined) {
      const newCategoryId = updateTrackDto.categoryId === null ? null : updateTrackDto.categoryId;
      track.categoryId = newCategoryId;
    }
    if (updateTrackDto.bpm !== undefined) {
      track.bpm = updateTrackDto.bpm === null ? null : updateTrackDto.bpm;
    }
    if (updateTrackDto.key !== undefined) {
      track.key = updateTrackDto.key;
    }
    if (updateTrackDto.price !== undefined) {
      track.price = updateTrackDto.price;
    }
    if (updateTrackDto.fileUrl !== undefined) {
      track.fileUrl = updateTrackDto.fileUrl;
    }
    if (updateTrackDto.previewUrl !== undefined) {
      track.previewUrl = updateTrackDto.previewUrl;
    }
    if (updateTrackDto.coverUrl !== undefined) {
      track.coverUrl = updateTrackDto.coverUrl;
    }
    if (updateTrackDto.tags !== undefined) {
      track.tags = updateTrackDto.tags;
    }
    if (updateTrackDto.isPublic !== undefined) {
      track.isPublic = updateTrackDto.isPublic;
    }

    // Use update method for more explicit update, especially for categoryId
    const updateData: any = {};
    if (updateTrackDto.title !== undefined) updateData.title = track.title;
    if (updateTrackDto.description !== undefined) updateData.description = track.description;
    if (updateTrackDto.categoryId !== undefined) updateData.categoryId = track.categoryId;
    if (updateTrackDto.bpm !== undefined) updateData.bpm = track.bpm;
    if (updateTrackDto.key !== undefined) updateData.key = track.key;
    if (updateTrackDto.price !== undefined) updateData.price = track.price;
    if (updateTrackDto.fileUrl !== undefined) updateData.fileUrl = track.fileUrl;
    if (updateTrackDto.previewUrl !== undefined) updateData.previewUrl = track.previewUrl;
    if (updateTrackDto.coverUrl !== undefined) updateData.coverUrl = track.coverUrl;
    if (updateTrackDto.tags !== undefined) updateData.tags = track.tags;
    if (updateTrackDto.isPublic !== undefined) updateData.isPublic = track.isPublic;
    
    await this.tracksRepository.update(id, updateData);
    
    // Reload the track with relations to return complete data (including updated category)
    const reloadedTrack = await this.findOne(id);
    
    return reloadedTrack;
  }

  async remove(id: number, user: User): Promise<void> {
    const track = await this.findOne(id);

    // Only producer or admin can delete
    if (track.producerId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('You can only delete your own tracks');
    }

    await this.tracksRepository.remove(track);
  }
}
