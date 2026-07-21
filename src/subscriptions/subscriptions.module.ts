import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { Subscription } from '../entities/subscription.entity';
import { User } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, User, UserProfile])],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

