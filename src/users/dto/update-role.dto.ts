import { IsEnum, IsNumber } from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class UpdateRoleDto {
  @IsNumber()
  userId: number;

  @IsEnum(UserRole)
  role: UserRole;
}

