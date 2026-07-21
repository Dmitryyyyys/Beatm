import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user.entity';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('track/:trackId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.PRODUCER)
  create(
    @Param('trackId', ParseIntPipe) trackId: number,
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: User,
  ) {
    return this.reviewsService.create(trackId, createReviewDto, user);
  }

  @Get('track/:trackId')
  findAllByTrack(
    @Param('trackId', ParseIntPipe) trackId: number,
    @CurrentUser() user?: User,
  ) {
    return this.reviewsService.findAllByTrack(trackId, user?.id);
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRODUCER)
  getMyReviews(@CurrentUser() user: User) {
    return this.reviewsService.getProducerReviews(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser() user: User,
  ) {
    return this.reviewsService.update(id, updateReviewDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.reviewsService.remove(id, user);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.PRODUCER)
  toggleLike(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.reviewsService.toggleLike(id, user);
  }
}


