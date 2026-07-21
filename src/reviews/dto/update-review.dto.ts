import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateReviewDto {
  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}


