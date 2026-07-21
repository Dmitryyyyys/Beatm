import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MessageSquare, Users, Heart, Bookmark, Clock, LogOut, Settings, User, Music, XCircle, Edit2, Trash2, Play, Pause, ShoppingBag } from 'lucide-react'
import TimeSortDropdown from '../components/TimeSortDropdown'
import LibrarySearchInput from '../components/LibrarySearchInput'
import { authService } from '../services/authService'
import { playHistoryService, PlayHistoryItem } from '../services/playHistoryService'
import UserAvatar from '../components/UserAvatar'
import { usersService } from '../services/usersService'
import { tracksService } from '../services/tracksService'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { useAudioPlayer } from '../contexts/AudioPlayerContext'

const RecentlyPlayedPage = () => {
  const navigate = useNavigate()
  const currentUser = authService.getCurrentUser()
  const { currentTrack, isPlaying, playTrack, pauseTrack } = useAudioPlayer()
  const [activeMenuItem, setActiveMenuItem] = useState<string>('recent')
  const [playHistory, setPlayHistory] = useState<PlayHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [trackToDelete, setTrackToDelete] = useState<{ id: number; title: string } | null>(null)
  const [timeFilter, setTimeFilter] = useState<'newest' | 'oldest' | null>(null)

  useEffect(() => {
    const init = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login')
        return
      }
      
      try {
        await loadPlayHistory()
        await loadUserProfile()
      } catch (error) {
        console.error('Error initializing RecentlyPlayedPage:', error)
      }
    }
    
    init()
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

  const loadPlayHistory = async () => {
    try {
      setLoading(true)
      const data = await playHistoryService.getMyPlayHistory()
      setPlayHistory(data || [])
    } catch (error) {
      console.error('Failed to load play history:', error)
      setPlayHistory([]) // Set empty array on error to prevent white screen
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromHistory = async (trackId: number) => {
    try {
      await playHistoryService.removeFromHistory(trackId)
      loadPlayHistory() // Reload history after removal
    } catch (error) {
      console.error('Failed to remove from history:', error)
    }
  }

  const handleClearHistory = async () => {
    try {
      await playHistoryService.clearPlayHistory()
      loadPlayHistory() // Reload history after clearing
    } catch (error) {
      console.error('Failed to clear play history:', error)
      alert('Не удалось очистить историю прослушивания')
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
      loadPlayHistory() // Reload history after deletion
      setDeleteModalOpen(false)
      setTrackToDelete(null)
    } catch (error) {
      console.error('Failed to delete track:', error)
      alert('Не удалось удалить трек')
    }
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  const handlePlayClick = (track: any, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (currentTrack?.id === track.id && isPlaying) {
      pauseTrack()
    } else {
      playTrack(track)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Загрузка истории прослушивания...</p>
        </div>
      </div>
    )
  }

  // Safely filter play history
  let filteredHistory: PlayHistoryItem[] = []
  try {
    filteredHistory = (playHistory || []).filter(
      (item) => {
        if (!item || !item.track) return false
        try {
          const searchLower = searchQuery.toLowerCase()
          const matchesTitle = item.track.title?.toLowerCase().includes(searchLower) || false
          const matchesDescription = item.track.description?.toLowerCase().includes(searchLower) || false
          const matchesProducer = item.track.producer?.displayName?.toLowerCase().includes(searchLower) || false
          const matchesTags = item.track.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false
          
          return matchesTitle || matchesDescription || matchesProducer || matchesTags
        } catch (err) {
          console.error('Error filtering history item:', err, item)
          return false
        }
      }
    )

    // Apply time filter
    if (timeFilter === 'newest') {
      filteredHistory = [...filteredHistory].sort((a, b) => 
        new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
      )
    } else if (timeFilter === 'oldest') {
      filteredHistory = [...filteredHistory].sort((a, b) => 
        new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime()
      )
    }
  } catch (error) {
    console.error('Error filtering/sorting play history:', error)
    filteredHistory = []
  }

  return (
    <div className="h-full bg-gray-900 flex overflow-hidden">
      {/* Sidebar - Same as other pages */}
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
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Search, Filter, and Clear Button */}
          <div className="mb-6 flex items-center space-x-4">
            {/* Search */}
            <LibrarySearchInput
              className="flex-1"
              value={searchQuery}
              onChange={setSearchQuery}
            />

            <TimeSortDropdown value={timeFilter} onChange={setTimeFilter} />

            {/* Clear History Button */}
            {playHistory.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Очистить историю
              </button>
            )}
          </div>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">
                {searchQuery ? 'Ничего не найдено' : 'У вас пока нет истории прослушивания'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredHistory.map((item) => {
                const isTrackPlaying = currentTrack?.id === item.track.id && isPlaying
                return (
                  <div
                    key={item.id}
                    className="bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-700 group relative"
                  >
                    <Link to={`/tracks/${item.track.id}`}>
                      <div className="relative aspect-square bg-gradient-to-br from-primary-400 to-purple-600 group cursor-pointer">
                        {item.track.coverUrl ? (
                          <img
                            src={item.track.coverUrl}
                            alt={item.track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="h-8 w-8 text-white opacity-50" />
                          </div>
                        )}
                        
                        {/* BPM Badge */}
                        {item.track.bpm && (
                          <div className="absolute top-1.5 left-1.5 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded z-10">
                            {item.track.bpm} BPM
                          </div>
                        )}

                        {/* Edit and Delete Buttons - visible only to track owner */}
                        {currentUser && item.track.producerId === currentUser.id && (
                          <div className="absolute top-1.5 right-1.5 flex items-center space-x-1 z-20">
                            <Link
                              to={`/tracks/${item.track.id}/edit`}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-gray-800 bg-opacity-90 hover:bg-opacity-100 rounded-full p-1.5 transition-all shadow-md"
                              title="Редактировать трек"
                            >
                              <Edit2 className="h-3 w-3 text-gray-300" />
                            </Link>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDeleteClick(item.track.id, item.track.title)
                              }}
                              className="bg-red-500 bg-opacity-90 hover:bg-opacity-100 rounded-full p-1.5 transition-all shadow-md"
                              title="Удалить трек"
                            >
                              <Trash2 className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        )}

                        {/* Play Button Overlay */}
                        {(item.track.previewUrl || item.track.fileUrl) && (
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                            <button
                              onClick={(e) => handlePlayClick(item.track, e)}
                              className="relative bg-gray-800 bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transform transition-transform z-10"
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
                      <Link to={`/tracks/${item.track.id}`}>
                        <h3 className="font-bold text-sm text-white mb-0.5 truncate group-hover:text-primary-600 transition-colors">
                          {item.track.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-gray-300 mb-2 truncate">
                        {item.track.producer?.displayName || 'Unknown Producer'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-primary-600">
                          ${parseFloat((item.track.price || 0).toString()).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    {/* Remove from history button - positioned at bottom right to avoid conflict with edit/delete buttons */}
                    <button
                      onClick={() => handleRemoveFromHistory(item.track.id)}
                      className="absolute bottom-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                      title="Удалить из истории"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
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
    </div>
  )
}

export default RecentlyPlayedPage
