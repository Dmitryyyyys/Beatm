import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { User } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private profilesRepository: Repository<UserProfile>,
  ) {}

  async subscribe(subscriberId: number, subscribedToId: number): Promise<Subscription> {
    if (subscriberId === subscribedToId) {
      throw new BadRequestException('Cannot subscribe to yourself');
    }

    const subscribedTo = await this.usersRepository.findOne({
      where: { id: subscribedToId },
    });

    if (!subscribedTo) {
      throw new NotFoundException('User not found');
    }

    if (subscribedTo.isBlocked) {
      throw new BadRequestException('Cannot subscribe to blocked user');
    }

    const existingSubscription = await this.subscriptionsRepository.findOne({
      where: {
        subscriberId,
        subscribedToId,
      },
    });

    if (existingSubscription) {
      return existingSubscription;
    }

    const subscription = this.subscriptionsRepository.create({
      subscriberId,
      subscribedToId,
    });

    return this.subscriptionsRepository.save(subscription);
  }

  async unsubscribe(subscriberId: number, subscribedToId: number): Promise<void> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: {
        subscriberId,
        subscribedToId,
      },
    });

    if (subscription) {
      await this.subscriptionsRepository.remove(subscription);
    }
  }

  async getUserSubscriptions(userId: number) {
    const subscriptions = await this.subscriptionsRepository.find({
      where: { subscriberId: userId },
      relations: ['subscribedTo'],
      order: { createdAt: 'DESC' },
    });

    const result = await Promise.all(
      subscriptions.map(async (sub) => {
        const profile = await this.profilesRepository.findOne({
          where: { userId: sub.subscribedToId },
        });

        return {
          id: sub.id,
          subscribedTo: {
            id: sub.subscribedTo.id,
            displayName: sub.subscribedTo.displayName,
            role: sub.subscribedTo.role,
            avatarUrl: profile?.avatarUrl || null,
            country: profile?.country || null,
            city: profile?.city || null,
          },
          subscribedAt: sub.createdAt,
        };
      }),
    );

    return result;
  }

  async getUserSubscribers(userId: number) {
    const subscriptions = await this.subscriptionsRepository.find({
      where: { subscribedToId: userId },
      relations: ['subscriber'],
      order: { createdAt: 'DESC' },
    });

    const result = await Promise.all(
      subscriptions.map(async (sub) => {
        const profile = await this.profilesRepository.findOne({
          where: { userId: sub.subscriberId },
        });

        return {
          id: sub.id,
          subscriber: {
            id: sub.subscriber.id,
            displayName: sub.subscriber.displayName,
            role: sub.subscriber.role,
            avatarUrl: profile?.avatarUrl || null,
            country: profile?.country || null,
            city: profile?.city || null,
          },
          subscribedAt: sub.createdAt,
        };
      }),
    );

    return result;
  }

  async isSubscribed(subscriberId: number, subscribedToId: number): Promise<boolean> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: {
        subscriberId,
        subscribedToId,
      },
    });

    return !!subscription;
  }

  async getSubscriptionCount(userId: number): Promise<number> {
    return this.subscriptionsRepository.count({
      where: { subscribedToId: userId },
    });
  }
}

