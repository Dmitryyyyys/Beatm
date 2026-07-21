import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useSWR from 'swr'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { 
  Shield, 
  Users, 
  Music, 
  TrendingUp, 
  DollarSign,
  Play,
  Download,
  Heart,
  UserPlus
} from 'lucide-react'
import { authService } from '../services/authService'
import api from '../services/api'

interface ChartDataPoint {
  date: string
  plays?: number
  downloads?: number
  purchases?: number
}

// SWR fetcher function
const fetcher = async (url: string) => {
  const response = await api.get(url)
  return response.data
}

const StatCard = ({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  color, 
  bgColor,
  delay = 0 
}: { 
  title: string
  value: number | string
  subtitle?: string
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
      <p className="text-3xl font-bold text-white mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-400">{subtitle}</p>
      )}
    </motion.div>
  )
}

const AdminPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    if (!authService.isAuthenticated() || !authService.isAdmin()) {
      navigate('/admin/login')
    }
  }, [navigate])

  const { data, error, isLoading } = useSWR('/analytics/admin', fetcher, {
    refreshInterval: 30000, // Обновление каждые 30 секунд
  })

  const user = authService.getCurrentUser()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
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

  const stats = data?.stats || {
    newUsersToday: 0,
    newUsersWeek: 0,
    newTracksToday: 0,
    newTracksWeek: 0,
    totalTracks: 0,
    activeProducers: 0,
    monthlyRevenue: 0,
  }

  const chartData = data?.charts?.activity || []
  const userGrowthData = data?.charts?.userGrowth || []

  // Форматирование дат для графиков
  const formattedChartData = (chartData as ChartDataPoint[]).map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
  }))

  const formattedUserGrowthData = (userGrowthData as ChartDataPoint[]).map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
  }))

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-6"
        >
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="h-8 w-8 text-primary-400" />
            <h1 className="text-3xl font-bold text-white">Панель администратора</h1>
          </div>
          <p className="text-gray-300">
            Добро пожаловать, {user?.displayName}!
          </p>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Новые пользователи"
            value={stats.newUsersToday}
            subtitle={`За неделю: ${stats.newUsersWeek}`}
            icon={Users}
            color="text-blue-400"
            bgColor="bg-blue-500/20"
            delay={0.1}
          />
          <StatCard
            title="Новые треки"
            value={stats.newTracksToday}
            subtitle={`За неделю: ${stats.newTracksWeek}`}
            icon={Music}
            color="text-purple-400"
            bgColor="bg-purple-500/20"
            delay={0.2}
          />
          <StatCard
            title="Всего треков"
            value={stats.totalTracks}
            icon={TrendingUp}
            color="text-green-400"
            bgColor="bg-green-500/20"
            delay={0.3}
          />
          <StatCard
            title="Активные продюсеры"
            value={stats.activeProducers}
            icon={Users}
            color="text-yellow-400"
            bgColor="bg-yellow-500/20"
            delay={0.4}
          />
          <StatCard
            title="Доход за месяц"
            value={`$${stats.monthlyRevenue.toFixed(2)}`}
            icon={DollarSign}
            color="text-emerald-400"
            bgColor="bg-emerald-500/20"
            delay={0.5}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Прослушивания по дням */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Play className="h-5 w-5 mr-2 text-primary-400" />
              Прослушивания по дням
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend wrapperStyle={{ color: '#F3F4F6' }} />
                <Line type="monotone" dataKey="plays" stroke="#3B82F6" strokeWidth={2} name="Прослушивания" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Скачивания */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Download className="h-5 w-5 mr-2 text-primary-400" />
              Скачивания
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend wrapperStyle={{ color: '#F3F4F6' }} />
                <Bar dataKey="downloads" fill="#8B5CF6" name="Скачивания" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Покупки */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-primary-400" />
              Покупки
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                />
                <Legend wrapperStyle={{ color: '#F3F4F6' }} />
                <Line type="monotone" dataKey="purchases" stroke="#10B981" strokeWidth={2} name="Покупки ($)" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Лайки / Комментарии */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Heart className="h-5 w-5 mr-2 text-primary-400" />
              Лайки / Комментарии
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend wrapperStyle={{ color: '#F3F4F6' }} />
                <Line type="monotone" dataKey="likes" stroke="#EF4444" strokeWidth={2} name="Лайки" />
                <Line type="monotone" dataKey="comments" stroke="#3B82F6" strokeWidth={2} name="Комментарии" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Рост пользователей */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-primary-400" />
            Рост пользователей
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={formattedUserGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend wrapperStyle={{ color: '#F3F4F6' }} />
              <Line type="monotone" dataKey="users" stroke="#10B981" strokeWidth={3} name="Всего пользователей" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminPage
