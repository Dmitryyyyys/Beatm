import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  async getConversations(@CurrentUser() user: User) {
    return this.messagesService.getUserConversations(user.id);
  }

  @Get('conversations/:id')
  async getConversation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.messagesService.getConversation(id, user.id);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.messagesService.getConversationMessages(id, user.id);
  }

  @Post()
  async sendMessage(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: User,
  ) {
    return this.messagesService.sendMessage(user.id, createMessageDto);
  }
}


