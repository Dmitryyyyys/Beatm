import { motion } from 'framer-motion'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { 
  Heart, 
  Eye, 
  Play, 
  Bookmark, 
  MessageSquare, 
  Download, 
  Users,
  TrendingUp,
  BarChart3,
  Music,
} from 'lucide-react'
import { ProducerAnalytics } from '../services/analyticsService'

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  bgColor,
  delay = 0 
}: { 
  title: string
  value: number
  icon: any
  color: string
  bgColor: string
  delay?: number
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700 hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-300 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white">
        {value.toLocaleString()}
      </p>
    </motion.div>
  )
}

interface AnalyticsViewProps {
  analytics: ProducerAnalytics
}

const AnalyticsView = ({ analytics }: AnalyticsViewProps) => {
  const stats = [
    {
      title: 'Лайки',
      value: analytics.totalLikes,
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Просмотры',
      value: analytics.totalViews,
      icon: Eye,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Прослушивания',
      value: analytics.totalPlays,
      icon: Play,
      color: 'text-green-500',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Сохранения',
      value: analytics.totalSaves,
      icon: Bookmark,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Комментарии',
      value: analytics.totalComments,
      icon: MessageSquare,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Скачивания',
      value: analytics.totalDownloads,
      icon: Download,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Подписчики',
      value: analytics.totalSubscribers,
      icon: Users,
      color: 'text-pink-500',
      bgColor: 'bg-pink-100',
    },
    {
      title: 'Всего треков',
      value: analytics.overview.totalTracks,
      icon: Music,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {stats.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            bgColor={stat.bgColor}
            delay={index * 0.1}
          />
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-primary-600" />
            Распределение активности
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Просмотры', value: analytics.totalViews, color: '#3b82f6' },
                  { name: 'Прослушивания', value: analytics.totalPlays, color: '#10b981' },
                  { name: 'Лайки', value: analytics.totalLikes, color: '#ef4444' },
                  { name: 'Сохранения', value: analytics.totalSaves, color: '#8b5cf6' },
                  { name: 'Комментарии', value: analytics.totalComments, color: '#f59e0b' },
                  { name: 'Скачивания', value: analytics.totalDownloads, color: '#6366f1' },
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  '#3b82f6',
                  '#10b981',
                  '#ef4444',
                  '#8b5cf6',
                  '#f59e0b',
                  '#6366f1',
                ].map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
            Топ треков по популярности
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={analytics.trackAnalytics
                .sort((a, b) => (b.likes + b.views + b.plays) - (a.likes + a.views + a.plays))
                .slice(0, 5)
                .map((track, index) => ({
                  index: index + 1,
                  Лайки: track.likes,
                  Просмотры: track.views,
                  Прослушивания: track.plays,
                }))}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" hide />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Лайки" fill="#ef4444" />
              <Bar dataKey="Просмотры" fill="#3b82f6" />
              <Bar dataKey="Прослушивания" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700 mb-8"
      >
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
          Сравнение метрик по трекам
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={analytics.trackAnalytics
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
              .map(track => ({
                name: track.trackTitle.length > 10 
                  ? track.trackTitle.substring(0, 10) + '...' 
                  : track.trackTitle,
                'Просмотры': track.views,
                'Прослушивания': track.plays,
                'Лайки': track.likes,
                'Сохранения': track.saves,
                'Комментарии': track.comments,
              }))}
            margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Просмотры" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="Прослушивания" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="Лайки" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="Сохранения" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="Комментарии" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
            Средние показатели
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Среднее лайков на трек</span>
              <span className="font-semibold text-white">
                {analytics.overview.averageLikesPerTrack.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Среднее просмотров на трек</span>
              <span className="font-semibold text-white">
                {analytics.overview.averageViewsPerTrack.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Среднее прослушиваний на трек</span>
              <span className="font-semibold text-white">
                {analytics.overview.averagePlaysPerTrack.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Среднее сохранений на трек</span>
              <span className="font-semibold text-white">
                {analytics.overview.averageSavesPerTrack.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Среднее комментариев на трек</span>
              <span className="font-semibold text-white">
                {analytics.overview.averageCommentsPerTrack.toFixed(1)}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <Music className="h-5 w-5 mr-2 text-primary-600" />
            Топ треков
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {analytics.trackAnalytics
              .sort((a, b) => (b.likes + b.views + b.plays) - (a.likes + a.views + a.plays))
              .slice(0, 10)
              .map((track, index) => (
                <div
                  key={track.trackId}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-400">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{track.trackTitle}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                        <span>{track.likes} лайков</span>
                        <span>{track.views} просмотров</span>
                        <span>{track.plays} прослушиваний</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Детальная аналитика по трекам</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Трек
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Лайки
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Просмотры
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Прослушивания
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Сохранения
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Комментарии
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Скачивания
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-200">
              {analytics.trackAnalytics.map((track) => (
                <motion.tr
                  key={track.trackId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-900 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{track.trackTitle}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(track.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {track.likes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {track.views}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {track.plays}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {track.saves}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {track.comments}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {track.downloads}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

export default AnalyticsView



