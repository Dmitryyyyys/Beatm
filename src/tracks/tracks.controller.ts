import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TracksService } from './tracks.service';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { FilterTracksDto } from './dto/filter-tracks.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user.entity';

@Controller('tracks')
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRODUCER)
  create(@Body() createTrackDto: CreateTrackDto, @CurrentUser() user: User) {
    return this.tracksService.create(createTrackDto, user);
  }

  @Get()
  findAll(@Query() filterDto: FilterTracksDto) {
    return this.tracksService.findAll(filterDto);
  }

  @Get('my-tracks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRODUCER)
  getMyTracks(@CurrentUser() user: User) {
    return this.tracksService.findByProducer(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tracksService.findOne(id);
  }

  @Post(':id/view')
  async incrementView(@Param('id', ParseIntPipe) id: number) {
    await this.tracksService.incrementViews(id);
    return { success: true };
  }

  @Post(':id/play')
  async incrementPlay(@Param('id', ParseIntPipe) id: number) {
    await this.tracksService.incrementPlayCount(id);
    return { success: true };
  }

  @Get(':id/play-count')
  async getPlayCount(@Param('id', ParseIntPipe) id: number) {
    const count = await this.tracksService.getPlayCount(id);
    return { count };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRODUCER, UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTrackDto: UpdateTrackDto,
    @CurrentUser() user: User,
  ) {
    return this.tracksService.update(id, updateTrackDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRODUCER, UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.tracksService.remove(id, user);
  }
}


