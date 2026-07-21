import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@CurrentUser() user: User) {
    const profile = await this.usersService.getProfile(user.id);
    return {
      ...user,
      profile: profile || null,
    };
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('isBlocked') isBlocked?: string,
  ) {
    return this.usersService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      role,
      isBlocked: isBlocked !== undefined ? isBlocked === 'true' : undefined,
    });
  }

  @Post('block')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async blockUser(@Body() blockUserDto: BlockUserDto) {
    return this.usersService.blockUser(blockUserDto);
  }

  @Put('role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUserRole(@Body() updateRoleDto: UpdateRoleDto) {
    return this.usersService.updateUserRole(updateRoleDto);
  }

  @Get('check/availability')
  async checkAvailability(
    @Query('email') email?: string,
    @Query('displayName') displayName?: string,
  ) {
    const result: { emailAvailable?: boolean; displayNameAvailable?: boolean } = {};

    if (email) {
      const user = await this.usersService.findByEmail(email);
      result.emailAvailable = !user;
    }

    if (displayName) {
      const user = await this.usersService.findByDisplayName(displayName);
      result.displayNameAvailable = !user;
    }

    return result;
  }

  @Get('public/:displayName')
  async getUserByDisplayName(@Param('displayName') displayName: string) {
    const user = await this.usersService.findByDisplayName(displayName);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.isBlocked) {
      throw new NotFoundException('User not found');
    }
    const profile = await this.usersService.getProfile(user.id);
    return {
      id: user.id,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
      profile: profile || null,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUserById(@Param('id') id: number) {
    return this.usersService.findOne(+id);
  }

  @Get(':id/details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUserDetails(@Param('id') id: number) {
    return this.usersService.getUserDetails(+id);
  }
}


