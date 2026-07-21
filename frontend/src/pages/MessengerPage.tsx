import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MessageSquare, Send, Users, Heart, Bookmark, Clock, LogOut, Settings, User, ArrowLeft, X, ShoppingBag } from 'lucide-react'
import { authService } from '../services/authService'
import { messagesService, Conversation, Message } from '../services/messagesService'
import { getCountryFlagUrl } from '../utils/countryFlags'
import UserAvatar from '../components/UserAvatar'
import { usersService } from '../services/usersService'

const MessengerPage = () => {
  const navigate = useNavigate()
  const { conversationId } = useParams<{ conversationId?: string }>()
  const currentUser = authService.getCurrentUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [activeMenuItem, setActiveMenuItem] = useState<string>('messages')
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login')
      return
    }
    loadConversations(true)
    loadUserProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadUserProfile = async () => {
    if (!currentUser?.displayName) return
    try {
      const profileData = await usersService.getPublicProfile(currentUser.displayName)
      setUserAvatarUrl(profileData.profile?.avatarUrl || null)
    } catch (error) {
      console.error('Failed to load user profile:', error)
    }
  }

  useEffect(() => {
    if (conversationId) {
      const convId = parseInt(conversationId)
      // Проверяем, не загружаем ли мы уже этот чат
      if (selectedConversation?.id === convId) {
        return
      }
      
      const conv = conversations.find((c) => c.id === convId)
      if (conv) {
        setSelectedConversation(conv)
        loadMessages(convId)
      } else if (conversations.length > 0) {
        // Если чат не найден в списке и список уже загружен, загружаем его отдельно
        messagesService.getConversation(convId)
          .then((conv) => {
            setSelectedConversation(conv)
            loadMessages(convId)
          })
          .catch(() => {
            setSelectedConversation(null)
            setMessages([])
          })
      }
    } else {
      setSelectedConversation(null)
      setMessages([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, conversations.length])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async (showPageLoader = false) => {
    try {
      if (showPageLoader) {
        setLoading(true)
      }
      const data = await messagesService.getConversations()
      setConversations(data)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      if (showPageLoader) {
        setLoading(false)
      }
    }
  }

  const updateConversationPreview = (content: string, createdAt: string) => {
    if (!selectedConversation || !currentUser) return

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== selectedConversation.id) return conv
        return {
          ...conv,
          lastMessage: {
            content,
            senderId: currentUser.id,
            createdAt,
          },
        }
      }),
    )
  }

  const loadMessages = async (convId: number) => {
    try {
      const data = await messagesService.getMessages(convId)
      setMessages(data)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const content = newMessage.trim()
    if (!content || !selectedConversation || !currentUser || isSending) return

    const tempId = -Date.now()
    const optimisticCreatedAt = new Date().toISOString()
    const optimisticMessage: Message = {
      id: tempId,
      conversationId: selectedConversation.id,
      senderId: currentUser.id,
      content,
      isRead: false,
      createdAt: optimisticCreatedAt,
      sender: {
        id: currentUser.id,
        displayName: currentUser.displayName,
      },
    }

    setNewMessage('')
    setMessages((prev) => [...prev, optimisticMessage])
    updateConversationPreview(content, optimisticCreatedAt)
    setIsSending(true)

    try {
      const sentMessage = await messagesService.sendMessage({
        recipientId: selectedConversation.otherUser.id,
        content,
      })

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
                ...sentMessage,
                sender: {
                  id: currentUser.id,
                  displayName: currentUser.displayName,
                },
              }
            : msg,
        ),
      )
      updateConversationPreview(sentMessage.content, sentMessage.createdAt)
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
      setNewMessage(content)
      alert('Не удалось отправить сообщение')
    } finally {
      setIsSending(false)
    }
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-900 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* User Info */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            {currentUser && (
              <UserAvatar 
                displayName={currentUser.displayName}
                avatarUrl={userAvatarUrl}
                size="md"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{currentUser?.displayName}</p>
              <p className="text-xs text-gray-400">{currentUser?.role}</p>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="space-y-1">
            <Link
              to="/messenger"
              onClick={() => setActiveMenuItem('messages')}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeMenuItem === 'messages'
                  ? 'bg-primary-600 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              <span>Сообщения</span>
            </Link>
            <Link
              to="/subscriptions"
              onClick={() => setActiveMenuItem('subscriptions')}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeMenuItem === 'subscriptions'
                  ? 'bg-primary-600 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Подписки</span>
            </Link>
            <Link
              to="/favorites"
              onClick={() => setActiveMenuItem('favorites')}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeMenuItem === 'favorites'
                  ? 'bg-primary-600 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Heart className="h-5 w-5" />
              <span>Понравившиеся</span>
            </Link>
            <Link
              to="/saved"
              onClick={() => setActiveMenuItem('saved')}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeMenuItem === 'saved'
                  ? 'bg-primary-600 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Bookmark className="h-5 w-5" />
              <span>Сохраненные</span>
            </Link>
            <Link
              to="/recent"
              onClick={() => setActiveMenuItem('recent')}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeMenuItem === 'recent'
                  ? 'bg-primary-600 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Clock className="h-5 w-5" />
              <span>Недавно прослушанные</span>
            </Link>
            <Link
              to="/orders"
              onClick={() => setActiveMenuItem('orders')}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeMenuItem === 'orders'
                  ? 'bg-primary-600 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <ShoppingBag className="h-5 w-5" />
              <span>Мои заказы</span>
            </Link>
          </nav>
        </div>

        {/* User Profile Link */}
        <div className="p-4 border-t border-gray-700">
          <Link
            to={`/profile/${currentUser?.displayName}`}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <User className="h-5 w-5" />
            <span>Мой профиль</span>
          </Link>
        </div>

        {/* Settings & Logout */}
        <div className="mt-auto p-4 border-t border-gray-700 space-y-1">
          <Link
            to="/settings/profile"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span>Настройки</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors w-full text-left"
          >
            <LogOut className="h-5 w-5" />
            <span>Выйти</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Conversations List */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* Title */}
          <div className="p-4 border-b border-gray-700">
            <h1 className="text-2xl font-bold text-white">Сообщения</h1>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Нет чатов</p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const initials = conversation.otherUser.displayName[0].toUpperCase()
                const isSelected = selectedConversation?.id === conversation.id
                
                return (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      if (!isSelected) {
                        navigate(`/messenger/${conversation.id}`)
                      }
                    }}
                    className={`w-full p-4 border-b border-gray-700 hover:bg-gray-900 transition-colors text-left ${
                      isSelected ? 'bg-primary-600 border-l-4 border-l-primary-600' : ''
                    }`}
                  >
                  <div className="flex items-center space-x-3">
                    <Link
                      to={`/profile/${conversation.otherUser.displayName}`}
                      onClick={(e) => e.stopPropagation()}
                      className="relative flex-shrink-0 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold">
                        {conversation.otherUser.avatarUrl ? (
                          <img
                            src={conversation.otherUser.avatarUrl}
                            alt={conversation.otherUser.displayName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      {conversation.otherUser.country && getCountryFlagUrl(conversation.otherUser.country) && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-800 border-2 border-gray-800">
                          <img
                            src={getCountryFlagUrl(conversation.otherUser.country)!}
                            alt={conversation.otherUser.country}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <Link
                          to={`/profile/${conversation.otherUser.displayName}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-white truncate hover:text-white transition-colors cursor-pointer"
                        >
                          {conversation.otherUser.displayName}
                        </Link>
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                              {new Date(conversation.lastMessage.createdAt).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <p className="text-sm text-gray-300 truncate">
                            {conversation.lastMessage.senderId === currentUser?.id ? 'Вы: ' : ''}
                            {conversation.lastMessage.content}
                          </p>
                        )}
                        {(conversation.unreadCount ?? 0) > 0 && (
                          <div className="mt-1 flex justify-end">
                            <span className="bg-primary-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setSelectedConversation(null)
                    navigate('/messenger')
                  }}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-300" />
                </button>
                <Link
                  to={`/profile/${selectedConversation.otherUser.displayName}`}
                  className="relative flex-shrink-0 hover:opacity-80 transition-opacity"
                >
                  {selectedConversation.otherUser.avatarUrl ? (
                    <img
                      src={selectedConversation.otherUser.avatarUrl}
                      alt={selectedConversation.otherUser.displayName}
                      className="w-10 h-10 rounded-full object-cover cursor-pointer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold cursor-pointer">
                      {selectedConversation.otherUser.displayName[0].toUpperCase()}
                    </div>
                  )}
                </Link>
                <Link
                  to={`/profile/${selectedConversation.otherUser.displayName}`}
                  className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
                >
                  <p className="text-sm text-gray-300">Чат с пользователем</p>
                  <h2 className="font-semibold text-white truncate cursor-pointer">{selectedConversation.otherUser.displayName}</h2>
                </Link>
                <button
                  onClick={() => {
                    setSelectedConversation(null)
                    navigate('/messenger')
                  }}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="h-5 w-5 text-gray-300" />
                </button>
              </div>
            </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-300">Начните беседу</p>
              </div>
            ) : (
              messages.map((message) => {
                const isMyMessage = message.senderId === currentUser?.id
                const messageKey = message.id < 0 ? `pending-${message.id}` : message.id
                const messageDate = new Date(message.createdAt)
                const now = new Date()
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                const msgDate = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate())
                const isToday = msgDate.getTime() === today.getTime()
                
                return (
                  <div
                    key={messageKey}
                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        isMyMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-white border border-gray-700'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isMyMessage ? 'text-blue-100' : 'text-gray-400'
                        }`}
                      >
                        {isToday ? 'Сегодня' : messageDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-gray-800 border-t border-gray-700 p-4">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder="Введите сообщение"
                disabled={isSending}
                className="flex-1 px-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-gray-800 text-white placeholder-gray-400 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!newMessage.trim() || isSending}
                className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-primary-400" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Выберите чат</h2>
              <p className="text-sm text-gray-300">Для того, чтобы отправить сообщение, выберите чат</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default MessengerPage

