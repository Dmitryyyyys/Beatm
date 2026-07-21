import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { Track } from '../entities/track.entity';
import { User } from '../entities/user.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(Track)
    private tracksRepository: Repository<Track>,
    @InjectRepository(CommentLike)
    private commentLikesRepository: Repository<CommentLike>,
  ) {}

  async create(
    trackId: number,
    createReviewDto: CreateReviewDto,
    user: User,
  ): Promise<Review> {
    // Check if track exists
    const track = await this.tracksRepository.findOne({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    // Allow multiple comments and unlimited replies
    // No need to check for duplicates since we're using comments, not ratings

    const review = this.reviewsRepository.create({
      ...createReviewDto,
      trackId,
      userId: user.id,
    });

    return this.reviewsRepository.save(review);
  }

  async findAllByTrack(trackId: number, currentUserId?: number): Promise<Review[]> {
    const reviews = await this.reviewsRepository.find({
      where: { trackId, isVisible: true },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    // Load likes count and user's like status for each review
    if (reviews.length > 0) {
      const reviewIds = reviews.map((r) => r.id);
      const likes = await this.commentLikesRepository
        .createQueryBuilder('like')
        .where('like.reviewId IN (:...reviewIds)', { reviewIds })
        .getMany();

      // Count likes per review
      const likesCountMap = new Map<number, number>();
      const userLikedMap = new Map<number, boolean>();

      likes.forEach((like) => {
        likesCountMap.set(like.reviewId, (likesCountMap.get(like.reviewId) || 0) + 1);
        if (currentUserId && like.userId === currentUserId) {
          userLikedMap.set(like.reviewId, true);
        }
      });

      // Add likes count and user's like status to reviews
      return reviews.map((review) => ({
        ...review,
        likesCount: likesCountMap.get(review.id) || 0,
        isLiked: userLikedMap.get(review.id) || false,
      })) as any;
    }

    return reviews;
  }

  async findOne(id: number): Promise<Review> {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['user', 'track'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async update(
    id: number,
    updateReviewDto: UpdateReviewDto,
    user: User,
  ): Promise<Review> {
    const review = await this.findOne(id);

    // Only review owner or admin can update
    const isOwner = review.userId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You can only update your own reviews',
      );
    }

    // Only admin can change visibility
    if (updateReviewDto.isVisible !== undefined && !isAdmin) {
      delete updateReviewDto.isVisible;
    }

    Object.assign(review, updateReviewDto);
    return this.reviewsRepository.save(review);
  }

  async remove(id: number, user: User): Promise<void> {
    const review = await this.findOne(id);

    // Only review owner or admin can delete
    const isOwner = review.userId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewsRepository.remove(review);
  }

  async getProducerReviews(producerId: number): Promise<Review[]> {
    return this.reviewsRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.track', 'track')
      .leftJoinAndSelect('review.user', 'user')
      .where('track.producerId = :producerId', { producerId })
      .andWhere('review.isVisible = :visible', { visible: true })
      .orderBy('review.createdAt', 'DESC')
      .getMany();
  }

  async toggleLike(reviewId: number, user: User): Promise<{ isLiked: boolean; likesCount: number }> {
    const review = await this.findOne(reviewId);

    const existingLike = await this.commentLikesRepository.findOne({
      where: { reviewId, userId: user.id },
    });

    if (existingLike) {
      // Unlike
      await this.commentLikesRepository.remove(existingLike);
    } else {
      // Like
      const like = this.commentLikesRepository.create({
        reviewId,
        userId: user.id,
      });
      await this.commentLikesRepository.save(like);
    }

    // Get updated likes count
    const likesCount = await this.commentLikesRepository.count({
      where: { reviewId },
    });

    // Check if user still likes (after toggle)
    const isLiked = !existingLike;

    return { isLiked, likesCount };
  }
}


