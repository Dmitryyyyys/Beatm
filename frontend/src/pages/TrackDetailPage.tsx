import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { Play, Pause, ShoppingCart, UserPlus, Calendar, Music, Clock, Hash, Heart, Bookmark, Headphones, Eye } from 'lucide-react'
import { tracksService } from '../services/tracksService'
import { Track } from '../types'
import { useAudioPlayer } from '../contexts/AudioPlayerContext'
import CommentsSection from '../components/CommentsSection'
import { authService } from '../services/authService'
import UserAvatar from '../components/UserAvatar'
import { usersService } from '../services/usersService'
import { favoritesService } from '../services/favoritesService'
import { savedTracksService } from '../services/savedTracksService'
import { purchasesService } from '../services/purchasesService'
import { subscriptionsService } from '../services/subscriptionsService'
import PurchaseModal from '../components/PurchaseModal'

const TrackDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [track, setTrack] = useState<Track | null>(null)
  const [loading, setLoading] = useState(true)
  const { currentTrack, isPlaying, playTrack, pauseTrack } = useAudioPlayer()
  const [savedCount, setSavedCount] = useState(0)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [producerAvatarUrl, setProducerAvatarUrl] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isTogglingSaved, setIsTogglingSaved] = useState(false)
  const [isPurchased, setIsPurchased] = useState(false)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isTogglingSubscription, setIsTogglingSubscription] = useState(false)
  const [viewsCount, setViewsCount] = useState(0)
  const [playCount, setPlayCount] = useState(0)
  const viewIncrementedRef = useRef(false)
  const currentUser = authService.getCurrentUser()

  useEffect(() => {
    // Reset ref when id changes
    viewIncrementedRef.current = false
  }, [id])

  useEffect(() => {
    const loadTrack = async () => {
      if (!id) return

      try {
        setLoading(true)
        const trackData = await tracksService.getById(parseInt(id))
        setTrack(trackData)
        
        // Set views count and play count from track data
        if (trackData.viewsCount !== undefined) {
          setViewsCount(trackData.viewsCount || 0)
        }
        if (trackData.playCount !== undefined) {
          setPlayCount(trackData.playCount || 0)
        }
        
        // Increment view count when track detail page is loaded (only once per id)
        // Skip increment for admin users
        if (!viewIncrementedRef.current && currentUser?.role !== 'admin') {
          viewIncrementedRef.current = true
          try {
            await tracksService.incrementView(trackData.id)
            // Update views count after incrementing
            setViewsCount(prev => prev + 1)
          } catch (error) {
            console.error('Failed to increment view count:', error)
            // Reset ref on error so it can be retried
            viewIncrementedRef.current = false
          }
        } else if (currentUser?.role === 'admin') {
          viewIncrementedRef.current = true
        }
        
        // Load play count (in case it was updated)
        try {
          const playCountValue = await tracksService.getPlayCount(trackData.id)
          setPlayCount(playCountValue)
        } catch (error) {
          console.error('Failed to load play count:', error)
          // Keep the value from trackData if API call fails
        }
        
        // Load favorite count
        try {
          const favoriteCount = await favoritesService.getFavoriteCount(trackData.id)
          setFavoriteCount(favoriteCount)
        } catch (error) {
          console.error('Failed to load favorite count:', error)
          setFavoriteCount(0)
        }

        try {
          const savedCount = await savedTracksService.getSavedCount(trackData.id)
          setSavedCount(savedCount)
        } catch (error) {
          console.error('Failed to load saved count:', error)
          setSavedCount(0)
        }
        
        // Load producer avatar
        if (trackData.producer?.displayName) {
          try {
            const profileData = await usersService.getPublicProfile(trackData.producer.displayName)
            setProducerAvatarUrl(profileData.profile?.avatarUrl || null)
          } catch (error) {
            console.error('Failed to load producer profile:', error)
          }
        }

        // Check if track is in favorites and saved (only for authenticated users)
        const currentUserData = authService.getCurrentUser()
        if (currentUserData) {
          try {
            const favoriteStatus = await favoritesService.checkFavorite(trackData.id)
            setIsFavorite(favoriteStatus)
          } catch (error) {
            console.error('Failed to check favorite status:', error)
            setIsFavorite(false)
          }
          
          try {
            const savedStatus = await savedTracksService.checkSaved(trackData.id)
            setIsSaved(savedStatus)
          } catch (error) {
            console.error('Failed to check saved status:', error)
            setIsSaved(false)
          }
          
          try {
            const purchasedStatus = await purchasesService.checkPurchase(trackData.id)
            setIsPurchased(purchasedStatus)
          } catch (error) {
            console.error('Failed to check purchase status:', error)
            setIsPurchased(false)
          }

          // Check subscription status (only if not the producer's own track)
          if (trackData.producerId && trackData.producerId !== currentUserData.id) {
            try {
              const subscribedStatus = await subscriptionsService.checkSubscription(trackData.producerId)
              setIsSubscribed(subscribedStatus)
            } catch (error) {
              console.error('Failed to check subscription status:', error)
              setIsSubscribed(false)
            }
          }
        } else {
          setIsFavorite(false)
          setIsSaved(false)
          setIsPurchased(false)
          setIsSubscribed(false)
        }
      } catch (error) {
        console.error('Failed to load track:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTrack()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handlePlayClick = () => {
    if (!track) return

    if (currentTrack?.id === track.id && isPlaying) {
      pauseTrack()
    } else {
      playTrack(track)
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!track || !currentUser || isTogglingFavorite) return

    try {
      setIsTogglingFavorite(true)
      
      if (isFavorite) {
        await favoritesService.removeFromFavorites(track.id)
        setIsFavorite(false)
        // Reload favorite count to get accurate number
        try {
          const count = await favoritesService.getFavoriteCount(track.id)
          setFavoriteCount(count)
        } catch (error) {
          setFavoriteCount(prev => Math.max(0, prev - 1))
        }
      } else {
        await favoritesService.addToFavorites(track.id)
        setIsFavorite(true)
        // Reload favorite count to get accurate number
        try {
          const count = await favoritesService.getFavoriteCount(track.id)
          setFavoriteCount(count)
        } catch (error) {
          setFavoriteCount(prev => prev + 1)
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setIsTogglingFavorite(false)
    }
  }

  const handleToggleSaved = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!track || !currentUser || isTogglingSaved) return

    try {
      setIsTogglingSaved(true)
      
      if (isSaved) {
        await savedTracksService.unsaveTrack(track.id)
        setIsSaved(false)
        // Reload saved count to get accurate number
        try {
          const count = await savedTracksService.getSavedCount(track.id)
          setSavedCount(count)
        } catch (error) {
          setSavedCount(prev => Math.max(0, prev - 1))
        }
      } else {
        await savedTracksService.saveTrack(track.id)
        setIsSaved(true)
        // Reload saved count to get accurate number
        try {
          const count = await savedTracksService.getSavedCount(track.id)
          setSavedCount(count)
        } catch (error) {
          setSavedCount(prev => prev + 1)
        }
      }
    } catch (error) {
      console.error('Failed to toggle saved:', error)
    } finally {
      setIsTogglingSaved(false)
    }
  }

  const handlePurchaseClick = () => {
    if (!currentUser) {
      const next = encodeURIComponent(location.pathname)
      navigate(`/login?next=${next}`)
      return
    }
    setIsPurchaseModalOpen(true)
  }

  const handlePurchaseConfirm = async () => {
    if (!track || !currentUser) return

    try {
      setIsProcessingPurchase(true)
      await purchasesService.purchaseTrack(track.id)
      setIsPurchased(true)
      setIsPurchaseModalOpen(false)
      // Optionally show success message
    } catch (error: any) {
      console.error('Failed to purchase track:', error)
      alert(error.response?.data?.message || 'Не удалось купить трек')
    } finally {
      setIsProcessingPurchase(false)
    }
  }

  const handleToggleSubscription = async () => {
    if (!track || !currentUser || !track.producerId || isTogglingSubscription) return

    // Don't allow subscribing to yourself
    if (track.producerId === currentUser.id) return

    try {
      setIsTogglingSubscription(true)
      if (isSubscribed) {
        await subscriptionsService.unsubscribe(track.producerId)
        setIsSubscribed(false)
      } else {
        await subscriptionsService.subscribe(track.producerId)
        setIsSubscribed(true)
      }
    } catch (error) {
      console.error('Failed to toggle subscription:', error)
      alert('Не удалось изменить подписку')
    } finally {
      setIsTogglingSubscription(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Загрузка трека...</p>
        </div>
      </div>
    )
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Трек не найден</h1>
          <Link to="/" className="text-primary-600 hover:underline">
            Вернуться на главную
          </Link>
        </div>
      </div>
    )
  }

  const isTrackPlaying = currentTrack?.id === track.id && isPlaying

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white truncate">{track.title}</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Cover Image, Tags, Statistics */}
          <div className="flex-shrink-0 w-full sm:w-[402px]">
            <div className="w-full aspect-square bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-4">
              <div className="relative w-full h-full bg-gradient-to-br from-primary-400 to-purple-600 group cursor-pointer">
                {track.coverUrl ? (
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="h-32 w-32 text-white opacity-50" />
                  </div>
                )}
                
                {/* Play Button Overlay */}
                {(track.previewUrl || track.fileUrl) && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                    <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                    <button
                      onClick={handlePlayClick}
                      className="relative bg-gray-800 bg-opacity-90 hover:bg-opacity-100 rounded-full p-5 transform transition-transform hover:scale-110 z-10"
                    >
                      {isTrackPlaying ? (
                        <Pause className="h-10 w-10 text-primary-600 fill-primary-600" />
                      ) : (
                        <Play className="h-10 w-10 text-primary-600 fill-primary-600 ml-1" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tags - under image */}
            <div className="w-full sm:w-[402px] mb-3">
              {track.tags && track.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {track.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-sm text-gray-300 hover:text-primary-600 transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-400">Нет тегов</span>
              )}
            </div>

            {/* Statistics with icons - under tags */}
            <div className="w-full sm:w-[402px] flex gap-6 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Headphones className="h-4 w-4" />
                <span>{playCount} прослушиваний</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{viewsCount} просмотров</span>
              </div>
            </div>
          </div>

          {/* Center Column - Track Info */}
          <div className="flex-1 min-w-0 lg:max-w-[404px]">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              {/* Track Info */}
              <div className="grid grid-cols-2 gap-4">
                {track.key && (
                  <div className="flex items-start space-x-2">
                    <Music className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-400">Тональность</div>
                      <div className="text-sm font-medium text-white">{track.key}</div>
                    </div>
                  </div>
                )}

                {track.bpm && (
                  <div className="flex items-start space-x-2">
                    <Clock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-400">BPM</div>
                      <div className="text-sm font-medium text-white">{track.bpm}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-400">Дата добавления</div>
                    <div className="text-sm font-medium text-white">{formatDate(track.createdAt)}</div>
                  </div>
                </div>

                {track.category && (
                  <div className="flex items-start space-x-2">
                    <Hash className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-400">Жанр</div>
                      <div className="text-sm font-medium text-white">{track.category.name}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {track.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-300 line-clamp-3">{track.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Purchase Block and Action Icons */}
          <div className="flex-shrink-0 w-full lg:w-[320px]">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-4">
              <div className="mb-4">
                <div className="text-3xl font-bold text-primary-600 mb-4">
                  ${parseFloat(track.price.toString()).toFixed(2)}
                </div>
                {currentUser?.role !== 'admin' && (
                  <button 
                    onClick={handlePurchaseClick}
                    disabled={isPurchased || (currentUser != null && track.producerId === currentUser.id)}
                    className={`w-full font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                      isPurchased
                        ? 'bg-green-600 text-white cursor-not-allowed'
                        : currentUser && track.producerId === currentUser.id
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>
                      {isPurchased 
                        ? 'Куплено' 
                        : currentUser && track.producerId === currentUser.id
                        ? 'Ваш трек'
                        : 'Купить сейчас'
                      }
                    </span>
                  </button>
                )}
              </div>

              {/* Producer Info */}
              {track.producer && (
                <div className="border-t border-gray-700 pt-4">
                  <Link
                    to={`/profile/${track.producer.displayName}`}
                    className="flex items-center space-x-3 group mb-3"
                  >
                    <UserAvatar
                      displayName={track.producer.displayName}
                      avatarUrl={producerAvatarUrl || undefined}
                      size="lg"
                      linkToProfile={false}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white group-hover:text-primary-600 transition-colors truncate text-sm">
                        {track.producer.displayName}
                      </div>
                    </div>
                  </Link>
                  {track.producer && currentUser && track.producerId !== currentUser.id && currentUser.role !== 'admin' ? (
                    <button
                      onClick={handleToggleSubscription}
                      disabled={isTogglingSubscription}
                      className={`w-full font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm ${
                        isSubscribed
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      } ${isTogglingSubscription ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>{isSubscribed ? 'Отписаться' : 'Подписаться'}</span>
                    </button>
                  ) : track.producer && currentUser && track.producerId === currentUser.id ? null : track.producer && (!currentUser || currentUser.role !== 'admin') ? (
                    <button
                      disabled
                      className="w-full bg-gray-400 text-white font-medium py-2 px-4 rounded-lg cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Войдите, чтобы подписаться</span>
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg px-4 py-3">
              <div className="flex items-center justify-center">
                {currentUser?.role !== 'admin' ? (
                  <button
                    type="button"
                    onClick={currentUser ? handleToggleSaved : undefined}
                    disabled={!currentUser || isTogglingSaved}
                    className={`flex flex-1 flex-col items-center gap-1 py-1 transition-colors ${
                      !currentUser
                        ? 'text-gray-600 cursor-default'
                        : isSaved
                          ? 'text-primary-400 hover:text-primary-300'
                          : 'text-gray-500 hover:text-gray-300'
                    } ${isTogglingSaved ? 'opacity-50 cursor-wait' : currentUser ? 'cursor-pointer' : ''}`}
                    title={currentUser ? (isSaved ? 'Убрать из сохранённых' : 'Сохранить') : 'Войдите, чтобы сохранить'}
                  >
                    <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
                    <span className="text-xs tabular-nums">{savedCount}</span>
                  </button>
                ) : (
                  <div className="flex flex-1 flex-col items-center gap-1 py-1 text-gray-600">
                    <Bookmark className="h-5 w-5" />
                    <span className="text-xs tabular-nums">{savedCount}</span>
                  </div>
                )}

                <div className="h-8 w-px bg-gray-700 shrink-0 mx-2" aria-hidden />

                {currentUser?.role !== 'admin' ? (
                  <button
                    type="button"
                    onClick={currentUser ? handleToggleFavorite : undefined}
                    disabled={!currentUser || isTogglingFavorite}
                    className={`flex flex-1 flex-col items-center gap-1 py-1 transition-colors ${
                      !currentUser
                        ? 'text-gray-600 cursor-default'
                        : isFavorite
                          ? 'text-red-400 hover:text-red-300'
                          : 'text-gray-500 hover:text-gray-300'
                    } ${isTogglingFavorite ? 'opacity-50 cursor-wait' : currentUser ? 'cursor-pointer' : ''}`}
                    title={currentUser ? (isFavorite ? 'Убрать из понравившихся' : 'Нравится') : 'Войдите, чтобы оценить'}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                    <span className="text-xs tabular-nums">{favoriteCount}</span>
                  </button>
                ) : (
                  <div className="flex flex-1 flex-col items-center gap-1 py-1 text-gray-600">
                    <Heart className="h-5 w-5" />
                    <span className="text-xs tabular-nums">{favoriteCount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        {track && (
          <div className="w-full mt-6">
            <CommentsSection trackId={track.id} />
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onConfirm={handlePurchaseConfirm}
        track={track}
        isProcessing={isProcessingPurchase}
      />
    </div>
  )
}

export default TrackDetailPage
