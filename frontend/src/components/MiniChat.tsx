import { useState, useEffect, useRef } from 'react'
import { X, Send, ArrowLeft } from 'lucide-react'
import { messagesService, Message, CreateMessageDto } from '../services/messagesService'
import { authService } from '../services/authService'
import UserAvatar from './UserAvatar'

interface MiniChatProps {
  isOpen: boolean
  onClose: () => void
  recipientId: number
  recipientName: string
  recipientAvatarUrl?: string
}

const MiniChat = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  recipientAvatarUrl,
}: MiniChatProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUser = authService.getCurrentUser()

  useEffect(() => {
    if (isOpen && recipientId) {
      loadConversation()
    } else {
      setMessages([])
      setConversationId(null)
    }
  }, [isOpen, recipientId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversation = async () => {
    try {
      setLoading(true)
      const conversations = await messagesService.getConversations()
      const conversation = conversations.find(
        (conv) => conv.otherUser.id === recipientId
      )

      if (conversation) {
        setConversationId(conversation.id)
        const messagesData = await messagesService.getMessages(conversation.id)
        setMessages(messagesData)
      } else {
        setConversationId(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUser) return

    try {
      const messageData: CreateMessageDto = {
        recipientId,
        content: newMessage.trim(),
      }

      const sentMessage = await messagesService.sendMessage(messageData)

      setMessages((prev) => [
        ...prev,
        {
          ...sentMessage,
          sender: {
            id: currentUser.id,
            displayName: currentUser.displayName,
          },
        },
      ])

      if (!conversationId && sentMessage.conversationId) {
        setConversationId(sentMessage.conversationId)
      }

      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    } else if (messageDate.getTime() === today.getTime() - 86400000) {
      return 'Вчера'
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-20 right-4 w-96 h-[600px] bg-gray-800 rounded-lg shadow-2xl border border-gray-700 flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800 rounded-t-lg">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-300" />
          </button>
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <UserAvatar
              displayName={recipientName}
              avatarUrl={recipientAvatarUrl}
              size="sm"
              linkToProfile={false}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-300 truncate">
                Чат с пользователем
              </p>
              <p className="text-sm font-semibold text-white truncate">
                {recipientName}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <X className="h-5 w-5 text-gray-300" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Начните общение
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isMyMessage = message.senderId === currentUser?.id
              return (
                <div
                  key={message.id}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      isMyMessage
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-white border border-gray-600'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isMyMessage ? 'text-blue-100' : 'text-gray-400'
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-lg">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Введите сообщение"
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-white placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default MiniChat

