import { useState, useEffect, Component, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { 
  BarChart3,
  ArrowLeft,
  Music2
} from 'lucide-react'
import { authService } from '../services/authService'
import { ProducerAnalytics } from '../services/analyticsService'
import UserAvatar from '../components/UserAvatar'
import { usersService } from '../services/usersService'
import AnalyticsView from '../components/AnalyticsView'
import BeatSequencer from '../components/BeatSequencer'

class StudioErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 max-w-lg">
            <h2 className="text-red-400 text-lg font-bold mb-2">Ошибка в компоненте</h2>
            <pre className="text-red-300 text-sm whitespace-pre-wrap break-all">{this.state.error.message}</pre>
            <button onClick={() => this.setState({ error: null })} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Попробовать снова</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

import api from '../services/api'

const fetcher = async (url: string) => {
  const response = await api.get(url)
  return response.data
}

type TabType = 'analytics' | 'beatmaker'

const StudioPage = () => {
  const navigate = useNavigate()
  const currentUser = authService.getCurrentUser()
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('analytics')

  useEffect(() => {
    if (!authService.isAuthenticated() || currentUser?.role !== 'producer') {
      navigate('/')
      return
    }

    const loadUserProfile = async () => {
      if (!currentUser?.displayName) return
      try {
        const profileData = await usersService.getPublicProfile(currentUser.displayName)
        setUserAvatarUrl(profileData.profile?.avatarUrl || null)
      } catch (error) {
        console.error('Failed to load user profile:', error)
      }
    }

    loadUserProfile()
  }, [currentUser, navigate])

  const { data: analytics, error, isLoading } = useSWR<ProducerAnalytics>(
    activeTab === 'analytics' ? '/analytics/producer' : null,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  )

  if (!authService.isAuthenticated() || currentUser?.role !== 'producer') {
    return null
  }

  if (activeTab === 'analytics' && isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Загрузка аналитики...</p>
        </div>
      </div>
    )
  }

  if (activeTab === 'analytics' && (error || !analytics)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Ошибка загрузки аналитики</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Обновить
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Вернуться на главную"
              >
                <ArrowLeft className="h-6 w-6 text-gray-300" />
              </button>
              <div className="p-2 bg-primary-600 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Студия</h1>
                <p className="text-sm text-gray-300">Панель продюсера</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <UserAvatar
                displayName={currentUser.displayName}
                avatarUrl={userAvatarUrl || undefined}
                size="md"
              />
              <div className="text-right">
                <p className="font-semibold text-white">{currentUser.displayName}</p>
                <p className="text-xs text-gray-400">Продюсер</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        <div className="w-64 bg-gray-800 border-r border-gray-700 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Аналитика</span>
            </button>
            <button
              onClick={() => setActiveTab('beatmaker')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'beatmaker'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Music2 className="h-5 w-5" />
              <span>Создание бита</span>
            </button>
          </nav>
        </div>

        <div className="flex-1 bg-gray-900">
          {activeTab === 'analytics' && analytics && <AnalyticsView analytics={analytics} />}
          {activeTab === 'beatmaker' && <StudioErrorBoundary><BeatSequencer /></StudioErrorBoundary>}
        </div>
      </div>
    </div>
  )
}

export default StudioPage

