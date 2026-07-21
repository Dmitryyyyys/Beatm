import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user.entity';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PRODUCER, UserRole.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('producer')
  async getProducerAnalytics(@CurrentUser() user: User) {
    return this.analyticsService.getProducerAnalytics(user.id);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  async getAdminStatistics() {
    return this.analyticsService.getAdminStatistics();
  }
}

