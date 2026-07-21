import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMySubscriptions(@CurrentUser() user: User) {
    return this.subscriptionsService.getUserSubscriptions(user.id);
  }

  @Get('followers')
  @UseGuards(JwtAuthGuard)
  async getMyFollowers(@CurrentUser() user: User) {
    return this.subscriptionsService.getUserSubscribers(user.id);
  }

  @Get(':userId/check')
  @UseGuards(JwtAuthGuard)
  async checkSubscription(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: User,
  ) {
    const isSubscribed = await this.subscriptionsService.isSubscribed(user.id, userId);
    return { isSubscribed };
  }

  @Get(':userId/count')
  async getSubscriptionCount(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const count = await this.subscriptionsService.getSubscriptionCount(userId);
    return { count };
  }

  @Post(':userId')
  @UseGuards(JwtAuthGuard)
  async subscribe(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: User,
  ) {
    return this.subscriptionsService.subscribe(user.id, userId);
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  async unsubscribe(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: User,
  ) {
    await this.subscriptionsService.unsubscribe(user.id, userId);
    return { message: 'Unsubscribed successfully' };
  }
}

