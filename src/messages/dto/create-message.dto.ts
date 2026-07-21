import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateMessageDto {
  @IsNumber()
  recipientId: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}


