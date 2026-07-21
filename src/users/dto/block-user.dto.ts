import { IsBoolean, IsNumber } from 'class-validator';

export class BlockUserDto {
  @IsNumber()
  userId: number;

  @IsBoolean()
  isBlocked: boolean;
}


