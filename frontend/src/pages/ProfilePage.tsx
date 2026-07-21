import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MessageSquare, UserPlus, Heart, Music, Info, Camera, Play, Pause, Edit2, Trash2 } from 'lucide-react'
import { usersService, PublicUser } from '../services/usersService'
import { tracksService, TracksResponse } from '../services/tracksService'
import { Track } from '../types'
import { authService } from '../services/authService'
import { getCountryFlagUrl } from '../utils/countryFlags'
import { useAudioPlayer } from '../contexts/AudioPlayerContext'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { favoritesService, Favorite } from '../services/favoritesService'
import MiniChat from '../components/MiniChat'
import { subscriptionsService } from '../services/subscriptionsService'

type TabType = 'favorites' | 'details' | 'tracks'

const ProfilePage = () => {
  const { displayName } = useParams<{ displayName: string }>()
  const [user, setUser] = useState<PublicUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('favorites')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscriberCount, setSubscriberCount] = useState(0)
  const [isTogglingSubscription, setIsTogglingSubscription] = useState(false)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [favoritesLoading, setFavoritesLoading] = useState(false)
  const [producerTracks, setProducerTracks] = useState<Track[]>([])
  const [tracksLoading, setTracksLoading] = useState(false)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [trackToDelete, setTrackToDelete] = useState<{ id: number; title: string } | null>(null)
  const [isMiniChatOpen, setIsMiniChatOpen] = useState(false)
  const [recipientAvatarUrl, setRecipientAvatarUrl] = useState<string | null>(null)
  
  const { currentTrack, isPlaying, playTrack, pauseTrack } = useAudioPlayer()

  useEffect(() => {
    const loadProfile = async () => {
      if (!displayName) return

      try {
        setLoading(true)
        const userData = await usersService.getPublicProfile(displayName)
        setUser(userData)

        const currentUserData = authService.getCurrentUser()

        await loadUserFavorites(userData.id, 10)

        if (userData.role === 'producer') {
          await loadProducerTracks(userData.id)
        }

        if (userData.profile?.avatarUrl) {
          setRecipientAvatarUrl(userData.profile.avatarUrl)
        }

        try {
          const count = await subscriptionsService.getSubscriptionCount(userData.id)
          setSubscriberCount(count)
        } catch (error) {
          console.error('Failed to load subscriber count:', error)
        }

        if (currentUserData && userData.id !== currentUserData.id) {
          try {
            const subscribed = await subscriptionsService.checkSubscription(userData.id)
            setIsSubscribed(subscribed)
          } catch (error) {
            console.error('Failed to check subscription:', error)
          }
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [displayName])

  const loadProducerTracks = async (producerId: number) => {
    try {
      setTracksLoading(true)
      const response: TracksResponse = await tracksService.getAll({
        producerId,
        isPublic: true,
        limit: 100,
        page: 1,
      })
      setProducerTracks(response.tracks)
    } catch (error) {
      console.error('Failed to load producer tracks:', error)
    } finally {
      setTracksLoading(false)
    }
  }

  const handleToggleSubscription = async () => {
    if (!user || !currentUser || currentUser.role === 'admin' || isTogglingSubscription) return

    try {
      setIsTogglingSubscription(true)
      if (isSubscribed) {
        await subscriptionsService.unsubscribe(user.id)
        setIsSubscribed(false)
      } else {
        await subscriptionsService.subscribe(user.id)
        setIsSubscribed(true)
      }
      const count = await subscriptionsService.getSubscriptionCount(user.id)
      setSubscriberCount(count)
    } catch (error) {
      console.error('Failed to toggle subscription:', error)
      alert('Не удалось изменить подписку')
    } finally {
      setIsTogglingSubscription(false)
    }
  }

  const loadUserFavorites = async (userId: number, limit?: number) => {
    try {
      setFavoritesLoading(true)
      const data = await favoritesService.getUserFavorites(userId)
      if (limit) {
        setFavorites((data || []).slice(0, limit))
      } else {
        setFavorites(data || [])
      }
    } catch (error) {
      console.error('Failed to load user favorites:', error)
      setFavorites([]) // Set empty array on error
    } finally {
      setFavoritesLoading(false)
    }
  }

  const handleDeleteClick = (trackId: number, trackTitle: string) => {
    setTrackToDelete({ id: trackId, title: trackTitle })
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!trackToDelete) return

    try {
      await tracksService.delete(trackToDelete.id)
      if (user?.role === 'producer') {
        await loadProducerTracks(user.id)
      }
      setDeleteModalOpen(false)
      setTrackToDelete(null)
    } catch (error) {
      console.error('Failed to delete track:', error)
      alert('Не удалось удалить трек')
    }
  }

  const currentUser = authService.getCurrentUser()
  const isMyProfile = currentUser && user && currentUser.id === user.id

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Пользователь не найден</h1>
          <Link to="/" className="text-primary-600 hover:underline">
            Вернуться на главную
          </Link>
        </div>
      </div>
    )
  }

  const initials = user.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user.displayName[0].toUpperCase()

  const fullName = [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ')

  const handleAvatarUpdate = async (imageData: string) => {
    try {
      await usersService.updateProfile({ avatarUrl: imageData })
      const userData = await usersService.getPublicProfile(displayName!)
      setUser(userData)
      setAvatarPreview(null)
    } catch (error) {
      console.error('Failed to update avatar:', error)
      setAvatarPreview(null)
    }
  }

  const handleBannerUpdate = async (imageData: string) => {
    try {
      await usersService.updateProfile({ bannerUrl: imageData })
      const userData = await usersService.getPublicProfile(displayName!)
      setUser(userData)
      setBannerPreview(null)
    } catch (error) {
      console.error('Failed to update banner:', error)
      setBannerPreview(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Profile Banner */}
      <div 
        className="h-48 md:h-64 relative bg-gradient-to-r from-primary-600 via-primary-700 to-purple-700 group"
        style={(bannerPreview || user.profile?.bannerUrl) ? { backgroundImage: `url(${bannerPreview || user.profile?.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        {(bannerPreview || user.profile?.bannerUrl) && (
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        )}
        {isMyProfile && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onloadend = () => {
                    setBannerPreview(reader.result as string)
                    handleBannerUpdate(reader.result as string)
                  }
                  reader.readAsDataURL(file)
                }
              }}
              className="hidden"
            />
            <button
              onClick={() => bannerInputRef.current?.click()}
              className="bg-gray-800 bg-opacity-0 group-hover:bg-opacity-90 hover:bg-opacity-100 rounded-lg px-4 py-2 flex items-center space-x-2 transition-all opacity-0 group-hover:opacity-100"
            >
              <Camera className="h-5 w-5 text-white" />
              <span className="text-sm font-medium text-white">
                {user.profile?.bannerUrl ? 'Изменить баннер' : 'Загрузить баннер'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        {/* Profile Header */}
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6 border border-gray-700">
          <div className="px-6 py-6">
            <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
              {/* Avatar */}
              <div className="flex-shrink-0 mb-4 md:mb-0 relative">
                <div className="relative group">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-700 border-4 border-gray-800 shadow-lg flex items-center justify-center text-3xl md:text-4xl font-bold text-primary-400 overflow-hidden">
                    {(avatarPreview || user.profile?.avatarUrl) ? (
                      <img
                        src={avatarPreview || user.profile?.avatarUrl}
                        alt={user.displayName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  {isMyProfile && (
                    <>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              setAvatarPreview(reader.result as string)
                              handleAvatarUpdate(reader.result as string)
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-primary-600 text-white rounded-full p-2 shadow-lg hover:bg-primary-700 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
                {/* Country Flag */}
                {user.profile?.country && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-full p-1 shadow-lg">
                    {getCountryFlagUrl(user.profile.country) ? (
                      <img
                        src={getCountryFlagUrl(user.profile.country)!}
                        alt={user.profile.country}
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <span className="text-xs font-semibold text-gray-600 px-2">
                        {user.profile.country.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                      {user.displayName}
                    </h1>
                    {fullName && (
                      <p className="text-base md:text-lg text-gray-300 mb-2">
                        {fullName}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                      <span>{subscriberCount} подписчиков</span>
                      {user.role === 'producer' && producerTracks.length > 0 && (
                        <span>{producerTracks.length} товаров</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {currentUser && user && currentUser.id !== user.id && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button 
                      onClick={() => setIsMiniChatOpen(true)}
                      className="flex items-center space-x-2 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Сообщение</span>
                    </button>
                    {currentUser && currentUser.role !== 'admin' && (
                      <button
                        onClick={handleToggleSubscription}
                        disabled={isTogglingSubscription}
                        className={`flex items-center space-x-2 font-medium px-4 py-2 rounded-lg transition-colors ${
                          isSubscribed
                            ? 'bg-primary-600 hover:bg-primary-700 text-white'
                            : 'bg-gray-900 hover:bg-gray-800 text-white'
                        } ${isTogglingSubscription ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>{isSubscribed ? 'Отписаться' : 'Подписаться'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-700">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === 'favorites'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                }`}
              >
                <Heart className="h-4 w-4" />
                <span>Понравившееся</span>
              </button>
              {user.role === 'producer' && (
                <button
                  onClick={() => setActiveTab('tracks')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
                    activeTab === 'tracks'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
                >
                  <Music className="h-4 w-4" />
                  <span>Треки</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('details')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === 'details'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                }`}
              >
                <Info className="h-4 w-4" />
                <span>Подробнее</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          {activeTab === 'favorites' && (
            <div>
              {favorites.length >= 10 && (
                <div className="flex items-center justify-end mb-6">
                  <Link
                    to="/favorites"
                    className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                  >
                    Показать все →
                  </Link>
                </div>
              )}
              {favoritesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-400">Загрузка...</p>
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {authService.getCurrentUser()?.id === user?.id 
                      ? 'У вас пока нет понравившихся треков' 
                      : 'У пользователя пока нет понравившихся треков'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {favorites.map((favorite) => (
                    <Link
                      key={favorite.id}
                      to={`/tracks/${favorite.track.id}`}
                      className="bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-700 group"
                    >
                      <div className="relative aspect-square bg-gradient-to-br from-primary-400 to-purple-600 group cursor-pointer">
                        {favorite.track.coverUrl ? (
                          <img
                            src={favorite.track.coverUrl}
                            alt={favorite.track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="h-8 w-8 text-white opacity-50" />
                          </div>
                        )}
                        
                        {/* BPM Badge */}
                        {favorite.track.bpm && (
                          <div className="absolute top-1.5 left-1.5 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded z-10">
                            {favorite.track.bpm} BPM
                          </div>
                        )}

                        {/* Play Button Overlay */}
                        {(favorite.track.previewUrl || favorite.track.fileUrl) && (
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const isTrackPlaying = currentTrack?.id === favorite.track.id && isPlaying
                                if (isTrackPlaying) {
                                  pauseTrack()
                                } else {
                                  playTrack(favorite.track)
                                }
                              }}
                              className="relative bg-gray-700 bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transform transition-transform z-10"
                            >
                              {currentTrack?.id === favorite.track.id && isPlaying ? (
                                <Pause className="h-6 w-6 text-primary-600 fill-primary-600" />
                              ) : (
                                <Play className="h-6 w-6 text-primary-600 fill-primary-600 ml-0.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <h3 className="font-bold text-sm text-white mb-0.5 truncate group-hover:text-primary-400 transition-colors">
                          {favorite.track.title}
                        </h3>
                        <p className="text-xs text-gray-400 mb-2 truncate">
                          {favorite.track.producer?.displayName || 'Unknown Producer'}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-primary-600">
                            ${parseFloat((favorite.track.price || 0).toString()).toFixed(2)}
                          </div>
                          {favorite.track.bpm && (
                            <div className="text-xs text-gray-500">{favorite.track.bpm} BPM</div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tracks' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Треки продюсера</h2>
              {tracksLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-400">Загрузка треков...</p>
                </div>
              ) : producerTracks.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">У продюсера пока нет треков</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {producerTracks.map((track) => (
                    <div
                      key={track.id}
                      className="bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-700 group flex flex-col"
                    >
                      {/* Cover Image */}
                      <Link to={`/tracks/${track.id}`}>
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
                          
                          {/* Play Overlay */}
                          {(track.previewUrl || track.fileUrl) && (
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                              <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  // Если этот трек уже играет, останавливаем его
                                  if (currentTrack?.id === track.id && isPlaying) {
                                    pauseTrack()
                                  } else {
                                    // Иначе запускаем трек
                                    playTrack(track)
                                  }
                                }}
                                className="relative bg-gray-700 bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transform transition-transform z-10"
                              >
                                {currentTrack?.id === track.id && isPlaying ? (
                                  <Pause className="h-6 w-6 text-primary-600 fill-primary-600" />
                                ) : (
                                  <Play className="h-6 w-6 text-primary-600 fill-primary-600 ml-0.5" />
                                )}
                              </button>
                            </div>
                          )}

                          {/* BPM Badge */}
                          {track.bpm && (
                            <div className="absolute top-1.5 left-1.5 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded z-10">
                              {track.bpm} BPM
                            </div>
                          )}

                          {isMyProfile && (
                            <div className="absolute top-1.5 right-1.5 flex items-center space-x-1 z-20">
                              <Link
                                to={`/tracks/${track.id}/edit`}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-gray-700 bg-opacity-90 hover:bg-opacity-100 rounded-full p-1.5 transition-all shadow-md"
                                title="Редактировать трек"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-white" />
                              </Link>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleDeleteClick(track.id, track.title)
                                }}
                                className="bg-red-500 bg-opacity-90 hover:bg-opacity-100 rounded-full p-1.5 transition-all shadow-md"
                                title="Удалить трек"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-white" />
                              </button>
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="p-2.5">
                        <Link to={`/tracks/${track.id}`}>
                          <h3 className="font-bold text-sm text-white mb-0.5 truncate group-hover:text-primary-400 transition-colors">
                            {track.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-gray-400 mb-2 truncate">
                          {track.key
                            ? `Key: ${track.key}`
                            : track.category?.name || '\u00A0'}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-primary-600">
                            ${parseFloat(track.price.toString()).toFixed(2)}
                          </div>
                          {track.bpm && (
                            <div className="text-xs text-gray-500">{track.bpm} BPM</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Информация о пользователе</h2>
              <div className="space-y-6">
                {/* Описание профиля */}
                {user.profile?.bio && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2">О себе</h3>
                    <p className="text-white whitespace-pre-wrap leading-relaxed">{user.profile.bio}</p>
                  </div>
                )}
                
                {/* Контактная информация */}
                {(user.profile?.phone || user.profile?.country || user.profile?.city) && (
                  <div className="border-t border-gray-700 pt-6">
                    <h3 className="text-sm font-semibold text-white mb-4">Контактная информация</h3>
                    <div className="space-y-4">
                      {user.profile?.phone && (
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-24">
                            <p className="text-sm text-gray-400">Телефон</p>
                          </div>
                          <p className="text-white">{user.profile.phone}</p>
                        </div>
                      )}
                      
                      {user.profile?.country && (
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-24">
                            <p className="text-sm text-gray-400">Страна</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getCountryFlagUrl(user.profile.country) && (
                              <img
                                src={getCountryFlagUrl(user.profile.country)!}
                                alt={user.profile.country}
                                className="w-5 h-5 rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none'
                                }}
                              />
                            )}
                            <p className="text-white">{user.profile.country}</p>
                          </div>
                        </div>
                      )}
                      
                      {user.profile?.city && (
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-24">
                            <p className="text-sm text-gray-400">Город</p>
                          </div>
                          <p className="text-white">{user.profile.city}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!user.profile?.phone && !user.profile?.country && !user.profile?.city && !user.profile?.bio && (
                  <div className="text-center py-12">
                    <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Информация не заполнена</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setTrackToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Удалить трек"
        message="Вы уверены, что хотите удалить этот трек?"
        itemName={trackToDelete?.title}
      />

      {/* Mini Chat */}
      {currentUser && user && currentUser.id !== user.id && (
        <MiniChat
          isOpen={isMiniChatOpen}
          onClose={() => setIsMiniChatOpen(false)}
          recipientId={user.id}
          recipientName={user.displayName}
          recipientAvatarUrl={recipientAvatarUrl || undefined}
        />
      )}
    </div>
  )
}

export default ProfilePage

