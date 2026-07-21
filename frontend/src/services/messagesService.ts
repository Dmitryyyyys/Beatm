import api from './api'

export interface Conversation {
  id: number
  participant1Id: number
  participant2Id: number
  lastMessageAt?: string
  otherUser: {
    id: number
    displayName: string
    avatarUrl?: string
    country?: string
  }
  lastMessage?: {
    content: string
    senderId: number
    createdAt: string
  }
  unreadCount?: number
}

export interface Message {
  id: number
  conversationId: number
  senderId: number
  content: string
  isRead: boolean
  createdAt: string
  sender?: {
    id: number
    displayName: string
    avatarUrl?: string
  }
}

export interface CreateMessageDto {
  recipientId: number
  content: string
}

export const messagesService = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get<Conversation[]>('/messages/conversations')
    return response.data
  },

  getConversation: async (conversationId: number): Promise<Conversation> => {
    const response = await api.get<Conversation>(`/messages/conversations/${conversationId}`)
    return response.data
  },

  getMessages: async (conversationId: number): Promise<Message[]> => {
    const response = await api.get<Message[]>(`/messages/conversations/${conversationId}/messages`)
    return response.data
  },

  sendMessage: async (data: CreateMessageDto): Promise<Message> => {
    const response = await api.post<Message>('/messages', data)
    return response.data
  },
}


