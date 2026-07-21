import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PlayHistoryService } from './play-history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user.entity';

@Controller('play-history')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER, UserRole.ADMIN, UserRole.PRODUCER)
export class PlayHistoryController {
  constructor(private readonly playHistoryService: PlayHistoryService) {}

  @Post('track/:trackId')
  recordPlay(
    @Param('trackId', ParseIntPipe) trackId: number,
    @CurrentUser() user: User,
  ) {
    return this.playHistoryService.recordPlay(trackId, user);
  }

  @Get()
  getMyPlayHistory(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.playHistoryService.getUserPlayHistory(user.id, limitNum);
  }

  @Delete()
  clearPlayHistory(@CurrentUser() user: User) {
    return this.playHistoryService.clearPlayHistory(user.id);
  }

  @Delete('track/:trackId')
  removeFromHistory(
    @Param('trackId', ParseIntPipe) trackId: number,
    @CurrentUser() user: User,
  ) {
    return this.playHistoryService.removeFromHistory(trackId, user.id);
  }
}


