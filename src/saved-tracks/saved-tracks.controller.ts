import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SavedTracksService } from './saved-tracks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user.entity';

@Controller('saved-tracks')
export class SavedTracksController {
  constructor(private readonly savedTracksService: SavedTracksService) {}

  @Post('track/:trackId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.PRODUCER)
  saveTrack(
    @Param('trackId', ParseIntPipe) trackId: number,
    @CurrentUser() user: User,
  ) {
    return this.savedTracksService.saveTrack(trackId, user);
  }

  @Delete('track/:trackId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.PRODUCER)
  unsaveTrack(
    @Param('trackId', ParseIntPipe) trackId: number,
    @CurrentUser() user: User,
  ) {
    return this.savedTracksService.unsaveTrack(trackId, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.PRODUCER)
  getMySavedTracks(@CurrentUser() user: User) {
    return this.savedTracksService.getUserSavedTracks(user.id);
  }

  @Get('track/:trackId/check')
  @UseGuards(JwtAuthGuard)
  async checkSaved(
    @Param('trackId', ParseIntPipe) trackId: number,
    @CurrentUser() user: User,
  ) {
    const isSaved = await this.savedTracksService.isSaved(trackId, user.id);
    return { isSaved };
  }

  @Get('track/:trackId/count')
  // Public endpoint - no auth required
  async getSavedCount(
    @Param('trackId', ParseIntPipe) trackId: number,
  ) {
    const count = await this.savedTracksService.getSavedCount(trackId);
    return { count };
  }
}

