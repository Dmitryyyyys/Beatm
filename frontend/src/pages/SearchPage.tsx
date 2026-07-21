import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { SlidersHorizontal, Play, Pause, Music, Heart, ShoppingCart, Edit2, Trash2 } from 'lucide-react'
import { tracksService, TrackFilters } from '../services/tracksService'
import { categoriesService } from '../services/categoriesService'
import { Track } from '../types'
import { useAudioPlayer } from '../contexts/AudioPlayerContext'
import { authService } from '../services/authService'
import { favoritesService } from '../services/favoritesService'
import { purchasesService } from '../services/purchasesService'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import PurchaseModal from '../components/PurchaseModal'
import FilterRangeInput, { filterFieldClass } from '../components/FilterRangeInput'

const SearchPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tracks, setTracks] = useState<(Track & { producer?: { id: number; displayName: string }; category?: { id: number; name: string; slug: string }; reviewsCount?: number })[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Search query
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  
  // Filters
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(1000)
  const [minBpm, setMinBpm] = useState(1)
  const [maxBpm, setMaxBpm] = useState(300)
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [categorySearch, setCategorySearch] = useState('')
  
  // Sort
  const [sortBy, setSortBy] = useState<'popularity' | 'price' | 'newest' | 'priceAsc'>('newest')
  
  // Categories
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string }>>([])
  
  // User state
  const [currentUser, setCurrentUser] = useState<any>(authService.getCurrentUser())
  const { currentTrack, isPlaying, playTrack, pauseTrack } = useAudioPlayer()
  const [favoriteTracks, setFavoriteTracks] = useState<Set<number>>(new Set())
  const [purchasedTracks, setPurchasedTracks] = useState<Set<number>>(new Set())
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [trackToDelete, setTrackToDelete] = useState<{ id: number; title: string } | null>(null)
  const [purchaseModalTrack, setPurchaseModalTrack] = useState<Track | null>(null)
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false)

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoriesService.getAll()
        setCategories(data)
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }
    loadCategories()
  }, [])

  // Initialize from URL params
  useEffect(() => {
    const query = searchParams.get('q') || ''
    if (query !== searchQuery) {
      setSearchQuery(query)
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  // Memoize selectedCategories to prevent unnecessary re-renders
  const selectedCategoriesString = useMemo(() => JSON.stringify([...selectedCategories].sort((a, b) => a - b)), [selectedCategories])

  // Debounced search - fires API call after user stops changing filters
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const loadTracks = useCallback(async () => {
    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort()
    }
    abortRef.current = new AbortController()

    setLoading(true)
    try {
      const categories = JSON.parse(selectedCategoriesString)
      const filters: TrackFilters = {
        search: searchQuery || undefined,
        isPublic: true,
        page: currentPage,
        limit: 20,
        minPrice: minPrice > 0 ? minPrice : undefined,
        maxPrice: maxPrice < 1000 ? maxPrice : undefined,
        minBpm: minBpm > 1 ? minBpm : undefined,
        maxBpm: maxBpm < 300 ? maxBpm : undefined,
        categoryId: categories.length === 1 ? categories[0] : undefined,
        sortBy,
      }

      const response = await tracksService.getAll(filters)
      
      let filteredTracks = response.tracks
      
      if (categories.length > 1) {
        filteredTracks = filteredTracks.filter(track => 
          track.category && categories.includes(track.category.id)
        )
      }

      setTracks(filteredTracks)
      setTotal(response.total)
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return
      console.error('Failed to load tracks:', error)
      setTracks([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, minPrice, maxPrice, minBpm, maxBpm, selectedCategoriesString, sortBy, currentPage])

  // Debounce filter changes - 300ms delay
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      loadTracks()
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [loadTracks])

  // Initialize current user on mount
  useEffect(() => {
    setCurrentUser(authService.getCurrentUser())
  }, [])

  // Load favorites and purchases - only once when component mounts or user changes
  useEffect(() => {
    if (!currentUser) {
      setFavoriteTracks(new Set())
      setPurchasedTracks(new Set())
      return
    }

    let isMounted = true

    const loadUserData = async () => {
      try {
        const [favorites, purchases] = await Promise.all([
          favoritesService.getMyFavorites(),
          purchasesService.getMyPurchases(),
        ])
        if (isMounted) {
          setFavoriteTracks(new Set(favorites.map(f => f.trackId)))
          setPurchasedTracks(new Set(purchases.map(p => p.trackId)))
        }
      } catch (error) {
        console.error('Failed to load user data:', error)
        if (isMounted) {
          setFavoriteTracks(new Set())
          setPurchasedTracks(new Set())
        }
      }
    }

    loadUserData()

    return () => {
      isMounted = false
    }
  }, [currentUser?.id]) // Only depend on user ID, not the whole object

  const handleClearFilters = () => {
    setMinPrice(0)
    setMaxPrice(1000)
    setMinBpm(1)
    setMaxBpm(300)
    setSelectedCategories([])
    setCategorySearch('')
    setCurrentPage(1)
  }

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
    setCurrentPage(1)
  }

  const handleToggleFavorite = async (trackId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!currentUser) return

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

  const handlePurchaseConfirm = async () => {
    if (!purchaseModalTrack || !currentUser) return

    setIsProcessingPurchase(true)
    try {
      await purchasesService.purchaseTrack(purchaseModalTrack.id)
      setPurchasedTracks(prev => new Set(prev).add(purchaseModalTrack.id))
      setPurchaseModalTrack(null)
    } catch (error: any) {
      console.error('Failed to purchase track:', error)
      alert(error.response?.data?.message || 'Не удалось купить трек')
    } finally {
      setIsProcessingPurchase(false)
    }
  }

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  )

  const activeFiltersCount = [
    minPrice > 0 || maxPrice < 1000,
    minBpm > 1 || maxBpm < 300,
    selectedCategories.length > 0,
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-gray-800/90 border border-gray-700/50 rounded-xl p-5 sticky top-6 shadow-lg shadow-black/20">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <SlidersHorizontal className="h-5 w-5 text-primary-400" />
                  Фильтры
                </h2>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-primary-400 hover:text-primary-300"
                  >
                    Очистить
                  </button>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Цены</label>
                  <FilterRangeInput
                    fromValue={minPrice}
                    toValue={maxPrice}
                    min={0}
                    max={100000}
                    fromEmptyDefault={0}
                    toEmptyDefault={1000}
                    onFromChange={(v) => {
                      setMinPrice(v)
                      setCurrentPage(1)
                    }}
                    onToChange={(v) => {
                      setMaxPrice(v)
                      setCurrentPage(1)
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">BPM</label>
                  <FilterRangeInput
                    fromValue={minBpm}
                    toValue={maxBpm}
                    min={1}
                    max={300}
                    fromEmptyDefault={1}
                    toEmptyDefault={300}
                    onFromChange={(v) => {
                      setMinBpm(v)
                      setCurrentPage(1)
                    }}
                    onToChange={(v) => {
                      setMaxBpm(v)
                      setCurrentPage(1)
                    }}
                  />
                </div>

                {/* Genre/Category */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Жанр</label>
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Поиск по жанрам"
                    className={`${filterFieldClass} mb-3`}
                  />
                  <div className="filter-scrollbar space-y-0.5 max-h-56 overflow-y-auto pr-1 -mr-1">
                    {filteredCategories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-700/60 px-2 py-2 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => toggleCategory(category.id)}
                          className="h-4 w-4 shrink-0 rounded border-gray-600 bg-gray-900 text-primary-500 focus:ring-primary-500/40 focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-300">{category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort */}
            <div className="flex items-center justify-end mb-6">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any)
                    setCurrentPage(1)
                  }}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none pr-8 cursor-pointer"
                >
                  <option value="newest">Самые новые</option>
                  <option value="popularity">По популярности</option>
                  <option value="price">По цене (дорогие)</option>
                  <option value="priceAsc">По цене (дешевые)</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-400">
              Найдено треков: {total}
            </div>

            {/* Tracks Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>Треки не найдены</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {tracks.map((track) => {
                  const isCurrentTrack = currentTrack?.id === track.id
                  const isTrackPlaying = isCurrentTrack && isPlaying

                  return (
                    <div
                      key={track.id}
                      className="bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-700 group relative"
                    >
                      <div className="relative">
                        {/* Edit and Delete Buttons - visible to track owner and admin - outside Link */}
                        {currentUser && (track.producerId === currentUser.id || currentUser.role === 'admin') && (
                          <div className="absolute top-1.5 right-1.5 flex items-center space-x-1 z-30">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                navigate(`/tracks/${track.id}/edit`)
                              }}
                              className="bg-gray-700 bg-opacity-90 hover:bg-opacity-100 rounded-full p-1.5 transition-all shadow-md"
                              title="Редактировать трек"
                            >
                              <Edit2 className="h-3 w-3 text-gray-200" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDeleteClick(track.id, track.title)
                              }}
                              className="bg-red-500 bg-opacity-90 hover:bg-opacity-100 rounded-full p-1.5 transition-all shadow-md"
                              title="Удалить трек"
                            >
                              <Trash2 className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        )}
                        <Link to={`/tracks/${track.id}`}>
                          <div className="relative aspect-square bg-gradient-to-br from-primary-400 to-purple-600 group cursor-pointer">
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
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (isTrackPlaying) {
                                      pauseTrack()
                                    } else {
                                      playTrack(track, tracks)
                                    }
                                  }}
                                  className="relative bg-gray-700 bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transform transition-transform z-10"
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
                      </div>
                      <div className="p-2.5">
                        <Link to={`/tracks/${track.id}`}>
                          <h3 className="font-bold text-sm text-white mb-0.5 truncate group-hover:text-primary-400 transition-colors">
                            {track.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-gray-300 mb-2 truncate">
                          {track.producer?.displayName || 'Unknown Producer'}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="text-base font-bold text-white">
                            ${parseFloat(track.price.toString()).toFixed(2)}
                          </div>
                          <div className="flex items-center space-x-1.5">
                            {currentUser && currentUser.role !== 'admin' && (
                              <button
                                onClick={(e) => handleToggleFavorite(track.id, e)}
                                className={`p-1.5 hover:bg-gray-700 rounded-full transition-colors ${
                                  favoriteTracks.has(track.id) ? 'text-red-400' : 'text-gray-300'
                                }`}
                              >
                                <Heart className={`h-4 w-4 ${favoriteTracks.has(track.id) ? 'fill-current' : ''}`} />
                              </button>
                            )}
                            {currentUser && currentUser.role !== 'admin' && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  if (!currentUser) return
                                  if (track.producerId === currentUser.id) return
                                  setPurchaseModalTrack(track)
                                }}
                                disabled={!currentUser || purchasedTracks.has(track.id) || track.producerId === currentUser?.id}
                                className={`py-1 px-2 text-xs flex items-center space-x-1 rounded-lg transition-colors ${
                                  purchasedTracks.has(track.id)
                                    ? 'bg-green-600 text-white cursor-not-allowed'
                                    : track.producerId === currentUser?.id
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                                }`}
                              >
                                <ShoppingCart className="h-3 w-3" />
                                <span>
                                  {purchasedTracks.has(track.id)
                                    ? 'Куплено'
                                    : track.producerId === currentUser?.id
                                    ? 'Ваш трек'
                                    : 'Купить'
                                  }
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {total > 20 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                >
                  Назад
                </button>
                <span className="px-4 py-2 text-gray-300">
                  Страница {currentPage} из {Math.ceil(total / 20)}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(total / 20), prev + 1))}
                  disabled={currentPage >= Math.ceil(total / 20)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                >
                  Вперед
                </button>
              </div>
            )}
          </div>
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

      {/* Purchase Modal */}
      {purchaseModalTrack && (
        <PurchaseModal
          isOpen={!!purchaseModalTrack}
          onClose={() => setPurchaseModalTrack(null)}
          onConfirm={handlePurchaseConfirm}
          track={purchaseModalTrack}
          isProcessing={isProcessingPurchase}
        />
      )}
    </div>
  )
}

export default SearchPage

