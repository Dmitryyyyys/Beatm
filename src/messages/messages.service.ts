import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private profilesRepository: Repository<UserProfile>,
  ) {}

  async getOrCreateConversation(userId: number, otherUserId: number): Promise<Conversation> {
    // Гарантируем порядок: меньший ID всегда participant1
    const participant1Id = Math.min(userId, otherUserId);
    const participant2Id = Math.max(userId, otherUserId);

    let conversation = await this.conversationsRepository.findOne({
      where: {
        participant1Id,
        participant2Id,
      },
      relations: ['participant1', 'participant2'],
    });

    if (!conversation) {
      conversation = this.conversationsRepository.create({
        participant1Id,
        participant2Id,
      });
      conversation = await this.conversationsRepository.save(conversation);
      
      // Загружаем отношения
      conversation = await this.conversationsRepository.findOne({
        where: { id: conversation.id },
        relations: ['participant1', 'participant2'],
      });
    }

    return conversation;
  }

  async getUserConversations(userId: number) {
    const conversations = await this.conversationsRepository.find({
      where: [
        { participant1Id: userId },
        { participant2Id: userId },
      ],
      relations: ['participant1', 'participant2'],
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
    });

    const result = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser =
          conv.participant1Id === userId ? conv.participant2 : conv.participant1;

        const profile = await this.profilesRepository.findOne({
          where: { userId: otherUser.id },
        });

        // Получаем последнее сообщение
        const lastMessage = await this.messagesRepository.findOne({
          where: { conversationId: conv.id },
          order: { createdAt: 'DESC' },
          relations: ['sender'],
        });

        // Подсчитываем непрочитанные сообщения
        const unreadCount = await this.messagesRepository.count({
          where: {
            conversationId: conv.id,
            senderId: otherUser.id,
            isRead: false,
          },
        });

        return {
          id: conv.id,
          participant1Id: conv.participant1Id,
          participant2Id: conv.participant2Id,
          lastMessageAt: conv.lastMessageAt,
          otherUser: {
            id: otherUser.id,
            displayName: otherUser.displayName,
            avatarUrl: profile?.avatarUrl || null,
            country: profile?.country || null,
          },
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                senderId: lastMessage.senderId,
                createdAt: lastMessage.createdAt,
              }
            : null,
          unreadCount,
        };
      }),
    );

    return result;
  }

  async getConversationMessages(conversationId: number, userId: number) {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Проверяем, что пользователь является участником
    if (
      conversation.participant1Id !== userId &&
      conversation.participant2Id !== userId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const messages = await this.messagesRepository.find({
      where: { conversationId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });

    // Помечаем сообщения как прочитанные
    await this.messagesRepository.update(
      {
        conversationId,
        senderId: conversation.participant1Id === userId ? conversation.participant2Id : conversation.participant1Id,
        isRead: false,
      },
      { isRead: true },
    );

    return messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      content: msg.content,
      isRead: msg.isRead,
      createdAt: msg.createdAt,
      sender: {
        id: msg.sender.id,
        displayName: msg.sender.displayName,
        avatarUrl: null, // Можно добавить загрузку профиля
      },
    }));
  }

  async sendMessage(
    senderId: number,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    const conversation = await this.getOrCreateConversation(
      senderId,
      createMessageDto.recipientId,
    );

    const message = this.messagesRepository.create({
      conversationId: conversation.id,
      senderId,
      content: createMessageDto.content,
    });

    const savedMessage = await this.messagesRepository.save(message);

    // Обновляем время последнего сообщения в конверсации
    conversation.lastMessageAt = new Date();
    await this.conversationsRepository.save(conversation);

    return savedMessage;
  }

  async getConversation(conversationId: number, userId: number) {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
      relations: ['participant1', 'participant2'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.participant1Id !== userId &&
      conversation.participant2Id !== userId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const otherUser =
      conversation.participant1Id === userId
        ? conversation.participant2
        : conversation.participant1;

    const profile = await this.profilesRepository.findOne({
      where: { userId: otherUser.id },
    });

    return {
      id: conversation.id,
      participant1Id: conversation.participant1Id,
      participant2Id: conversation.participant2Id,
      lastMessageAt: conversation.lastMessageAt,
      otherUser: {
        id: otherUser.id,
        displayName: otherUser.displayName,
        avatarUrl: profile?.avatarUrl || null,
        country: profile?.country || null,
      },
    };
  }
}


