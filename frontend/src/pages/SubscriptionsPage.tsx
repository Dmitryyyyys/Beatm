import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MessageSquare, Users, Heart, Bookmark, Clock, LogOut, Settings, User, ShoppingBag, Play, Pause, Music } from 'lucide-react'
import { authService } from '../services/authService'
import { subscriptionsService, Subscription, Follower } from '../services/subscriptionsService'
import { getCountryFlagUrl } from '../utils/countryFlags'
import FollowerCard from '../components/FollowerCard'
import UserAvatar from '../components/UserAvatar'
import { usersService } from '../services/usersService'
import { favoritesService } from '../services/favoritesService'
import { tracksService } from '../services/tracksService'
import { Track } from '../types'
import { useAudioPlayer } from '../contexts/AudioPlayerContext'

type TabType = 'following' | 'followers'

const SubscriptionsPage = () => {
  const navigate = useNavigate()
  const currentUser = authService.getCurrentUser()
  const [activeTab, setActiveTab] = useState<TabType>('following')
  const [activeMenuItem, setActiveMenuItem] = useState<string>('subscriptions')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [followers, setFollowers] = useState<Follower[]>([])
  const [loading, setLoading] = useState(true)
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)
  const [userTracks, setUserTracks] = useState<Record<number, Track[]>>({})
  const [loadingTracks, setLoadingTracks] = useState<Record<number, boolean>>({})
  const [subscriberCounts, setSubscriberCounts] = useState<Record<number, number>>({})
  const { currentTrack, isPlaying, playTrack, pauseTrack } = useAudioPlayer()

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login')
      return
    }
    loadData()
    loadUserProfile()
  }, [navigate, activeTab])

  const loadUserProfile = async () => {
    if (!currentUser?.displayName) return
    try {
      const profileData = await usersService.getPublicProfile(currentUser.displayName)
      setUserAvatarUrl(profileData.profile?.avatarUrl || null)
    } catch (error) {
      console.error('Failed to load user profile:', error)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'following') {
        const data = await subscriptionsService.getMySubscriptions()
        setSubscriptions(data)
        // Загружаем треки и счетчики подписчиков для каждого пользователя
        data.forEach((sub) => {
          loadUserTracks(sub.subscribedTo.id, sub.subscribedTo.role)
          loadSubscriberCount(sub.subscribedTo.id)
        })
      } else {
        const data = await subscriptionsService.getMyFollowers()
        setFollowers(data)
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSubscriberCount = async (userId: number) => {
    try {
      const count = await subscriptionsService.getSubscriptionCount(userId)
      setSubscriberCounts((prev) => ({ ...prev, [userId]: count }))
    } catch (error) {
      console.error(`Failed to load subscriber count for user ${userId}:`, error)
    }
  }

  const loadUserTracks = async (userId: number, role: string) => {
    if (loadingTracks[userId]) return
    
    try {
      setLoadingTracks((prev) => ({ ...prev, [userId]: true }))
      
      let tracks: Track[] = []
      if (role === 'producer') {
        // Для продюсера загружаем созданные треки
        const response = await tracksService.getAll({
          producerId: userId,
          isPublic: true,
          limit: 5,
          page: 1,
        })
        tracks = response.tracks
      } else {
        // Для пользователя загружаем лайкнутые треки
        const favorites = await favoritesService.getUserFavorites(userId)
        tracks = favorites.slice(0, 5).map((fav) => fav.track)
      }
      
      setUserTracks((prev) => ({ ...prev, [userId]: tracks }))
    } catch (error) {
      console.error(`Failed to load tracks for user ${userId}:`, error)
    } finally {
      setLoadingTracks((prev) => ({ ...prev, [userId]: false }))
    }
  }

  const handleUnsubscribe = async (userId: number) => {
    try {
      await subscriptionsService.unsubscribe(userId)
      loadData()
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
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

  const filteredSubscriptions = subscriptions
  const filteredFollowers = followers

  return (
    <div className="h-full bg-gray-900 flex overflow-hidden">
      {/* Sidebar - Same as MessengerPage */}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <h1 className="text-2xl font-bold text-white mb-4">Подписки</h1>
          
          {/* Tabs */}
          <div className="flex space-x-4 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('following')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'following'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-300 hover:text-white'
              }`}
            >
              Подписки ({subscriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'followers'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-300 hover:text-white'
              }`}
            >
              Подписчики ({followers.length})
            </button>
          </div>
        </div>


        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'following' ? (
            <div>
                  {filteredSubscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300">
                    У вас пока нет подписок
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {filteredSubscriptions.map((subscription) => {
                    const user = subscription.subscribedTo
                    const initials = user.displayName[0].toUpperCase()
                    const tracks = userTracks[user.id] || []
                    const isTracksLoading = loadingTracks[user.id]

                    return (
                      <div
                        key={subscription.id}
                        className="bg-gray-800 rounded-lg border border-gray-700 p-6"
                      >
                        {/* User Info */}
                        <div className="flex items-start space-x-4 mb-4">
                          <Link
                            to={`/profile/${user.displayName}`}
                            className="relative flex-shrink-0"
                          >
                            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-primary-400 font-semibold text-xl">
                              {user.avatarUrl ? (
                                <img
                                  src={user.avatarUrl}
                                  alt={user.displayName}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                initials
                              )}
                            </div>
                            {user.country && getCountryFlagUrl(user.country) && (
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-800 border-2 border-gray-800">
                                <img
                                  src={getCountryFlagUrl(user.country)!}
                                  alt={user.country}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              </div>
                            )}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/profile/${user.displayName}`}
                              className="block"
                            >
                              <h3 className="text-xl font-bold text-white truncate hover:text-primary-600 transition-colors mb-1">
                                {user.displayName}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
                              <span>{subscriberCounts[user.id] || 0} подписчиков</span>
                              {user.role === 'producer' && tracks.length > 0 && (
                                <span>{tracks.length} товаров</span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUnsubscribe(user.id)}
                                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors text-sm"
                              >
                                Отписаться
                              </button>
                              <Link
                                to={`/messenger`}
                                className="px-4 py-2 bg-gray-800 border border-gray-700 hover:bg-gray-900 text-gray-300 font-medium rounded-lg transition-colors text-sm flex items-center"
                              >
                                Сообщение
                              </Link>
                            </div>
                          </div>
                        </div>

                        {/* Tracks Grid */}
                        {isTracksLoading ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                          </div>
                        ) : tracks.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {tracks.map((track) => {
                              const isCurrentTrack = currentTrack?.id === track.id
                              const isTrackPlaying = isCurrentTrack && isPlaying
                              
                              return (
                                <div
                                  key={track.id}
                                  className="bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-700 group relative"
                                >
                                  <Link to={`/tracks/${track.id}`} className="block">
                                    <div className="relative aspect-square bg-gradient-to-br from-primary-400 to-purple-600 cursor-pointer">
                                      {track.coverUrl ? (
                                        <img
                                          src={track.coverUrl}
                                          alt={track.title}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <Music className="h-8 w-8 text-white opacity-50" />
                                        </div>
                                      )}
                                      
                                      {/* BPM Badge */}
                                      {track.bpm && (
                                        <div className="absolute top-1.5 left-1.5 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded z-10">
                                          {track.bpm} BPM
                                        </div>
                                      )}

                                      {/* Play Button Overlay */}
                                      {(track.previewUrl || track.fileUrl) && (
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                          <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none"></div>
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault()
                                              e.stopPropagation()
                                              if (isTrackPlaying) {
                                                pauseTrack()
                                              } else {
                                                playTrack(track)
                                              }
                                            }}
                                            className="relative bg-gray-800 bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transform transition-transform z-10 pointer-events-auto"
                                          >
                                            {isTrackPlaying ? (
                                              <Pause className="h-6 w-6 text-primary-600 fill-primary-600" />
                                            ) : (
                                              <Play className="h-6 w-6 text-primary-600 fill-primary-600 ml-0.5" />
                                            )}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </Link>
                                  <div className="p-2.5">
                                    <Link to={`/tracks/${track.id}`}>
                                      <h3 className="font-bold text-sm text-white mb-0.5 truncate group-hover:text-primary-600 transition-colors">
                                        {track.title}
                                      </h3>
                                    </Link>
                                    <p className="text-xs text-gray-300 mb-2 truncate">
                                      {user.displayName}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <div className="text-lg font-bold text-primary-600">
                                        ${parseFloat((track.price || 0).toString()).toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div>
              {filteredFollowers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300">
                    У вас пока нет подписчиков
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFollowers.map((follower) => (
                    <FollowerCard
                      key={follower.id}
                      user={follower.subscriber}
                      onSubscribeChange={loadData}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SubscriptionsPage

