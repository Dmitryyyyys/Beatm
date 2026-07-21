import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsNumber()
  parentId?: number;
}


