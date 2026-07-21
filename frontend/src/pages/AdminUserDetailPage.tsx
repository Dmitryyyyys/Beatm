import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import useSWR from 'swr'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { 
  ArrowLeft,
  User as UserIcon,
  Mail,
  Calendar,
  Shield,
  Music,
  MessageSquare,
  Heart,
  Bookmark,
  ShoppingCart,
  Play,
  TrendingUp,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react'
import { authService } from '../services/authService'
import { reviewsService, Review } from '../services/reviewsService'
import api from '../services/api'
import UserAvatar from '../components/UserAvatar'

const fetcher = async (url: string) => {
  const response = await api.get(url)
  return response.data
}

const AdminUserDetailPage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editCommentText, setEditCommentText] = useState('')

  useEffect(() => {
    if (!authService.isAuthenticated() || !authService.isAdmin()) {
      navigate('/admin/login')
    }
  }, [navigate])

  const { data, error, isLoading, mutate } = useSWR(
    id ? `/users/${id}/details` : null,
    fetcher
  )

  const handleDeleteComment = async (commentId: number) => {
    try {
      await reviewsService.delete(commentId)
      mutate()
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert('Ошибка при удалении комментария')
    }
  }

  const handleEditComment = (comment: Review) => {
    setEditingCommentId(comment.id)
    setEditCommentText(comment.comment || '')
  }

  const handleSaveEdit = async (commentId: number) => {
    try {
      await reviewsService.update(commentId, { comment: editCommentText })
      setEditingCommentId(null)
      setEditCommentText('')
      mutate()
    } catch (error) {
      console.error('Failed to update comment:', error)
      alert('Ошибка при обновлении комментария')
    }
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditCommentText('')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-800 rounded-lg shadow-lg border border-red-700 p-6">
            <p className="text-red-400">Ошибка загрузки данных</p>
          </div>
        </div>
      </div>
    )
  }

  const { user, reviews, tracks, statistics, charts } = data
  const chartData = charts?.activity || []

  const formattedChartData = chartData.map((item: any) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
  }))

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор'
      case 'producer': return 'Продюсер'
      case 'user': return 'Пользователь'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'producer': return 'bg-purple-500/20 text-purple-400 border-purple-500/50'
      case 'user': return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            to="/admin/users"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Назад к списку пользователей
          </Link>
        </motion.div>

        {/* User Info Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-6"
        >
          <div className="flex items-start space-x-6">
            <UserAvatar
              displayName={user.displayName}
              avatarUrl={user.profile?.avatarUrl}
              size="xl"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{user.displayName}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.role)}`}>
                  {user.role === 'admin' && <Shield className="h-4 w-4 mr-1" />}
                  {user.role === 'producer' && <Music className="h-4 w-4 mr-1" />}
                  {user.role === 'user' && <UserIcon className="h-4 w-4 mr-1" />}
                  {getRoleLabel(user.role)}
                </span>
                {user.isBlocked && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/50">
                    Заблокирован
                  </span>
                )}
              </div>
              <div className="space-y-2 text-gray-300">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  {user.email}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Зарегистрирован: {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                </div>
                {user.profile && (
                  <>
                    {(user.profile.firstName || user.profile.lastName) && (
                      <div>
                        {user.profile.firstName} {user.profile.lastName}
                      </div>
                    )}
                    {user.profile.city && user.profile.country && (
                      <div>
                        {user.profile.city}, {user.profile.country}
                      </div>
                    )}
                    {user.profile.bio && (
                      <div className="mt-2 text-sm">{user.profile.bio}</div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-lg border border-gray-700 p-4"
          >
            <MessageSquare className="h-5 w-5 text-blue-400 mb-2" />
            <div className="text-2xl font-bold text-white">{statistics.totalComments}</div>
            <div className="text-sm text-gray-400">Комментарии</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-lg border border-gray-700 p-4"
          >
            <Heart className="h-5 w-5 text-red-400 mb-2" />
            <div className="text-2xl font-bold text-white">{statistics.totalFavorites}</div>
            <div className="text-sm text-gray-400">Лайки</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-lg border border-gray-700 p-4"
          >
            <Bookmark className="h-5 w-5 text-yellow-400 mb-2" />
            <div className="text-2xl font-bold text-white">{statistics.totalSaves}</div>
            <div className="text-sm text-gray-400">Сохранено</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800 rounded-lg border border-gray-700 p-4"
          >
            <ShoppingCart className="h-5 w-5 text-green-400 mb-2" />
            <div className="text-2xl font-bold text-white">{statistics.totalPurchases}</div>
            <div className="text-sm text-gray-400">Покупки</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800 rounded-lg border border-gray-700 p-4"
          >
            <Play className="h-5 w-5 text-purple-400 mb-2" />
            <div className="text-2xl font-bold text-white">{statistics.totalPlays}</div>
            <div className="text-sm text-gray-400">Прослушивания</div>
          </motion.div>
          {user.role === 'producer' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-800 rounded-lg border border-gray-700 p-4"
            >
              <Music className="h-5 w-5 text-primary-400 mb-2" />
              <div className="text-2xl font-bold text-white">{statistics.totalTracks}</div>
              <div className="text-sm text-gray-400">Треков</div>
            </motion.div>
          )}
        </div>

        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary-400" />
            Активность за последние 30 дней
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={formattedChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend wrapperStyle={{ color: '#F3F4F6' }} />
              <Line type="monotone" dataKey="comments" stroke="#3B82F6" strokeWidth={2} name="Комментарии" />
              <Line type="monotone" dataKey="favorites" stroke="#EF4444" strokeWidth={2} name="Лайки" />
              <Line type="monotone" dataKey="saves" stroke="#F59E0B" strokeWidth={2} name="Сохранения" />
              <Line type="monotone" dataKey="purchases" stroke="#10B981" strokeWidth={2} name="Покупки" />
              <Line type="monotone" dataKey="plays" stroke="#8B5CF6" strokeWidth={2} name="Прослушивания" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Producer Tracks Section */}
        {user.role === 'producer' && tracks && tracks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Music className="h-5 w-5 mr-2 text-primary-400" />
              Треки продюсера ({tracks.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tracks.map((track: any) => (
                <Link
                  key={track.id}
                  to={`/tracks/${track.id}`}
                  className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-primary-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{track.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {track.category?.name || 'Без категории'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-lg font-bold text-primary-400">
                      ${parseFloat(track.price?.toString() || '0').toFixed(2)}
                    </div>
                    {track.bpm && (
                      <div className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                        {track.bpm} BPM
                      </div>
                    )}
                  </div>
                  {track.description && (
                    <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                      {track.description}
                    </p>
                  )}
                  <div className="flex items-center mt-3 text-xs text-gray-400 space-x-3">
                    {track.viewsCount !== undefined && (
                      <span>Просмотры: {track.viewsCount}</span>
                    )}
                    {track.playCount !== undefined && (
                      <span>Прослушивания: {track.playCount}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Comments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: user.role === 'producer' && tracks && tracks.length > 0 ? 0.9 : 0.8 }}
          className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-primary-400" />
            Комментарии пользователя ({reviews?.length || 0})
          </h2>
          
          {reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <div
                  key={review.id}
                  className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Link
                        to={`/tracks/${review.track?.id}`}
                        className="text-primary-400 hover:text-primary-300 font-medium"
                      >
                        {review.track?.title || 'Трек удален'}
                      </Link>
                      <span className="text-gray-400 text-sm">
                        {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {editingCommentId === review.id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(review.id)}
                            className="p-1.5 text-green-400 hover:bg-gray-600 rounded transition-colors"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 text-gray-400 hover:bg-gray-600 rounded transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditComment(review)}
                            className="p-1.5 text-blue-400 hover:bg-gray-600 rounded transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(review.id)}
                            className="p-1.5 text-red-400 hover:bg-gray-600 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {editingCommentId === review.id ? (
                    <textarea
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                      className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white resize-none"
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-300 whitespace-pre-wrap">
                      {review.comment || <span className="text-gray-500 italic">Комментарий отсутствует</span>}
                    </p>
                  )}
                  {review.rating && (
                    <div className="mt-2 text-yellow-400">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Пользователь еще не оставил комментариев</p>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default AdminUserDetailPage

