import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user.entity';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post('track/:trackId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.PRODUCER)
  purchaseTrack(
    @Param('trackId', ParseIntPipe) trackId: number,
    @CurrentUser() user: User,
  ) {
    return this.purchasesService.purchaseTrack(trackId, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.PRODUCER)
  getMyPurchases(@CurrentUser() user: User) {
    return this.purchasesService.getUserPurchases(user.id);
  }

  @Get('track/:trackId/check')
  @UseGuards(JwtAuthGuard)
  async checkPurchase(
    @Param('trackId', ParseIntPipe) trackId: number,
    @CurrentUser() user: User,
  ) {
    const isPurchased = await this.purchasesService.isPurchased(
      trackId,
      user.id,
    );
    return { isPurchased };
  }
}


