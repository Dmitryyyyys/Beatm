import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user.entity';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('track/:trackId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.PRODUCER)
  addToFavorites(
    @Param('trackId', ParseIntPipe) trackId: number,
    @CurrentUser() user: User,
  ) {
    return this.favoritesService.addToFavorites(trackId, user);
  }

  @Delete('track/:trackId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.PRODUCER)
  removeFromFavorites(
    @Param('trackId', ParseIntPipe) trackId: number,
    @CurrentUser() user: User,
  ) {
    return this.favoritesService.removeFromFavorites(trackId, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.PRODUCER)
  getMyFavorites(@CurrentUser() user: User) {
    return this.favoritesService.getUserFavorites(user.id);
  }

  @Get('track/:trackId/check')
  @UseGuards(JwtAuthGuard)
  async checkFavorite(
    @Param('trackId', ParseIntPipe) trackId: number,
    @CurrentUser() user: User,
  ) {
    const isFavorite = await this.favoritesService.isFavorite(
      trackId,
      user.id,
    );
    return { isFavorite };
  }

  @Get('track/:trackId/count')
  async getFavoriteCount(
    @Param('trackId', ParseIntPipe) trackId: number,
  ) {
    const count = await this.favoritesService.getFavoriteCount(trackId);
    return { count };
  }

  @Get('user/:userId')
  async getUserFavorites(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.favoritesService.getUserFavorites(userId);
  }
}


