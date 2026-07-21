import { Play, Pause, Heart, ShoppingCart, ArrowRight, Edit2, Trash2, Music } from 'lucide-react'
import { useState, useEffect } from 'react'
import { tracksService } from '../services/tracksService'
import { Track } from '../types'
import { Link, useNavigate } from 'react-router-dom'
import { useAudioPlayer } from '../contexts/AudioPlayerContext'
import { authService } from '../services/authService'
import DeleteConfirmModal from './DeleteConfirmModal'
import { favoritesService } from '../services/favoritesService'
import { purchasesService } from '../services/purchasesService'
import PurchaseModal from './PurchaseModal'

const FeaturedTracks = () => {
  const navigate = useNavigate()
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const { currentTrack, isPlaying, playTrack, pauseTrack } = useAudioPlayer()
  const currentUser = authService.getCurrentUser()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [trackToDelete, setTrackToDelete] = useState<{ id: number; title: string } | null>(null)
  const [favoriteTracks, setFavoriteTracks] = useState<Set<number>>(new Set())
  const [purchasedTracks, setPurchasedTracks] = useState<Set<number>>(new Set())
  const [purchaseModalTrack, setPurchaseModalTrack] = useState<Track | null>(null)
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false)

  const handleDeleteClick = (trackId: number, trackTitle: string) => {
    setTrackToDelete({ id: trackId, title: trackTitle })
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!trackToDelete) return

    try {
      await tracksService.delete(trackToDelete.id)
      setTracks(tracks.filter(track => track.id !== trackToDelete.id))
      setDeleteModalOpen(false)
      setTrackToDelete(null)
    } catch (error) {
      console.error('Failed to delete track:', error)
      alert('Не удалось удалить трек')
    }
  }

  const handleToggleFavorite = async (trackId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!currentUser || currentUser.role === 'admin') {
      return
    }

    try {
      const isFavorite = favoriteTracks.has(trackId)
      if (isFavorite) {
        await favoritesService.removeFromFavorites(trackId)
        setFavoriteTracks(prev => {
          const newSet = new Set(prev)
          newSet.delete(trackId)
          return newSet
        })
      } else {
        await favoritesService.addToFavorites(trackId)
        setFavoriteTracks(prev => new Set(prev).add(trackId))
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const response = await tracksService.getAll({
          isPublic: true,
          limit: 8,
          page: 1,
        })
        setTracks(response.tracks)
      } catch (error) {
        console.error('Error loading tracks:', error)
      } finally {
        setLoading(false)
      }
    }
    loadTracks()
  }, [])

  useEffect(() => {
    if (!currentUser) {
      setFavoriteTracks(new Set())
      setPurchasedTracks(new Set())
      return
    }

    const loadFavorites = async () => {
      try {
        const allFavorites = await favoritesService.getMyFavorites()
        const favoriteIds = new Set(allFavorites.map(fav => fav.track.id))
        setFavoriteTracks(favoriteIds)
      } catch (error) {
        console.error('Error loading favorites:', error)
      }
    }

    const loadPurchases = async () => {
      try {
        const purchases = await purchasesService.getMyPurchases()
        const purchasedIds = new Set(purchases.map(p => p.trackId))
        setPurchasedTracks(purchasedIds)
      } catch (error) {
        console.error('Error loading purchases:', error)
      }
    }

    loadFavorites()
    loadPurchases()
  }, [currentUser?.id])

  if (loading) {
    return (
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-gray-300">Загрузка треков...</div>
          </div>
        </div>
      </section>
    )
  }

  if (tracks.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Популярные биты
          </h2>
          <p className="text-gray-300 text-lg">
            Самые востребованные треки на платформе
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-700 group"
            >
              <div className="relative">
                {currentUser && (track.producerId === currentUser.id || currentUser.role === 'admin') && (
                  <div className="absolute top-2 right-2 flex items-center space-x-1.5 z-30">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        navigate(`/tracks/${track.id}/edit`)
                      }}
                      className="bg-gray-700 bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all shadow-md"
                      title="Редактировать трек"
                    >
                      <Edit2 className="h-4 w-4 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDeleteClick(track.id, track.title)
                      }}
                      className="bg-red-500 bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all shadow-md"
                      title="Удалить трек"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                )}
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
                        <Music className="h-10 w-10 text-white opacity-50" />
                      </div>
                    )}
                    
                    {/* Play Overlay */}
                    {(track.previewUrl || track.fileUrl) && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (currentTrack?.id === track.id && isPlaying) {
                              pauseTrack()
                            } else {
                              playTrack(track, tracks)
                            }
                          }}
                          className="relative bg-gray-700 bg-opacity-90 hover:bg-opacity-100 rounded-full p-3.5 transform transition-transform z-10"
                        >
                          {currentTrack?.id === track.id && isPlaying ? (
                            <Pause className="h-7 w-7 text-primary-600 fill-primary-600" />
                          ) : (
                            <Play className="h-7 w-7 text-primary-600 fill-primary-600 ml-0.5" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* BPM Badge */}
                    {track.bpm && (
                      <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded z-10">
                        {track.bpm} BPM
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <h3 className="font-bold text-base text-white mb-1 truncate group-hover:text-primary-400 transition-colors">
                      {track.title}
                    </h3>
                    <p className="text-sm text-gray-400 truncate">
                      {track.producer?.displayName || 'Unknown Producer'}
                      {track.key && currentUser ? ` · ${track.key}` : ''}
                    </p>

                    {track.key && !currentUser && (
                      <p className="text-xs text-gray-500 mt-1.5 truncate">Key: {track.key}</p>
                    )}

                    {!currentUser && (
                      <div className="flex items-center justify-between gap-2 mt-2.5">
                        <div className="text-xl font-bold text-primary-400">
                          ${parseFloat(track.price.toString()).toFixed(2)}
                        </div>
                        <span className="py-2 px-3 text-sm bg-gray-700 group-hover:bg-gray-600 text-white rounded-lg transition-colors shrink-0">
                          Подробнее
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </div>

              {currentUser && (
              <div className="px-3 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xl font-bold text-primary-400">
                    ${parseFloat(track.price.toString()).toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {currentUser.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(track.id, e)}
                        className={`p-2 hover:bg-gray-700 rounded-full transition-colors ${
                          favoriteTracks.has(track.id) ? 'text-red-400' : 'text-gray-400'
                        }`}
                        aria-label={favoriteTracks.has(track.id) ? 'Убрать из понравившихся' : 'В понравившиеся'}
                      >
                        <Heart className={`h-5 w-5 ${favoriteTracks.has(track.id) ? 'fill-current' : ''}`} />
                      </button>
                    )}
                    {currentUser.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (track.producerId === currentUser.id) return
                          setPurchaseModalTrack(track)
                        }}
                        disabled={purchasedTracks.has(track.id) || track.producerId === currentUser.id}
                        className={`py-2 px-3 text-sm flex items-center gap-1.5 rounded-lg transition-colors ${
                          purchasedTracks.has(track.id)
                            ? 'bg-green-600 text-white cursor-not-allowed'
                            : track.producerId === currentUser.id
                            ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                            : 'bg-primary-600 hover:bg-primary-500 text-white'
                        }`}
                        aria-label="Купить трек"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>
                          {purchasedTracks.has(track.id)
                            ? 'Куплено'
                            : track.producerId === currentUser.id
                            ? 'Ваш трек'
                            : 'Купить'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/search"
            className="text-white hover:text-gray-200 font-semibold inline-flex items-center space-x-2"
          >
            <span>Показать все треки</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

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

        <PurchaseModal
          isOpen={!!purchaseModalTrack}
          onClose={() => setPurchaseModalTrack(null)}
          onConfirm={async () => {
            if (!purchaseModalTrack) return
            try {
              setIsProcessingPurchase(true)
              await purchasesService.purchaseTrack(purchaseModalTrack.id)
              setPurchasedTracks(prev => new Set(prev).add(purchaseModalTrack.id))
              setPurchaseModalTrack(null)
            } catch (error: any) {
              console.error('Failed to purchase track:', error)
              alert(error.response?.data?.message || 'Не удалось купить трек')
            } finally {
              setIsProcessingPurchase(false)
            }
          }}
          track={purchaseModalTrack}
          isProcessing={isProcessingPurchase}
        />
      </div>
    </section>
  )
}

export default FeaturedTracks
