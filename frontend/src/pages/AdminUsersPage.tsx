import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import useSWR from 'swr'
import { 
  Users, 
  Search, 
  Filter,
  Ban,
  Unlock,
  Shield,
  User as UserIcon,
  Music,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { authService } from '../services/authService'
import { usersService, AdminUser } from '../services/usersService'
import api from '../services/api'
import UserAvatar from '../components/UserAvatar'

// SWR fetcher function
const fetcher = async (url: string) => {
  const response = await api.get(url)
  return response.data
}

const AdminUsersPage = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<'all' | 'admin' | 'producer' | 'user'>('all')
  const [selectedBlocked, setSelectedBlocked] = useState<'all' | 'blocked' | 'active'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(20)
  const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null)

  useEffect(() => {
    if (!authService.isAuthenticated() || !authService.isAdmin()) {
      navigate('/admin/login')
    }
  }, [navigate])

  // Debounce search query - delay API call until user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1) // Reset to first page when search changes
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      limit,
    }
    if (debouncedSearchQuery.trim()) {
      params.search = debouncedSearchQuery.trim()
    }
    if (selectedRole !== 'all') {
      params.role = selectedRole
    }
    if (selectedBlocked !== 'all') {
      params.isBlocked = selectedBlocked === 'blocked'
    }
    return new URLSearchParams(params).toString()
  }, [debouncedSearchQuery, selectedRole, selectedBlocked, currentPage, limit])

  const { data, error, isLoading, mutate } = useSWR(
    `/users?${queryParams}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  const users = data?.users || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)

  const handleBlockUser = async (userId: number, isBlocked: boolean) => {
    try {
      await usersService.blockUser(userId, isBlocked)
      mutate()
      setActionMenuOpen(null)
    } catch (error) {
      console.error('Failed to block/unblock user:', error)
      alert('Ошибка при изменении статуса пользователя')
    }
  }

  const handleChangeRole = async (userId: number, role: 'admin' | 'producer' | 'user') => {
    try {
      await usersService.updateUserRole(userId, role)
      mutate()
      setActionMenuOpen(null)
    } catch (error) {
      console.error('Failed to change user role:', error)
      alert('Ошибка при изменении роли пользователя')
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Администратор'
      case 'producer':
        return 'Продюсер'
      case 'user':
        return 'Пользователь'
      default:
        return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'producer':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50'
      case 'user':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

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

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-primary-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Управление пользователями</h1>
                <p className="text-gray-400 text-sm mt-1">
                  Всего пользователей: {total}
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Поиск по имени..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-400"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value as any)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white appearance-none"
              >
                <option value="all">Все роли</option>
                <option value="user">Пользователи</option>
                <option value="producer">Продюсеры</option>
                <option value="admin">Администраторы</option>
              </select>
            </div>

            {/* Blocked Filter */}
            <div className="relative">
              <Ban className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={selectedBlocked}
                onChange={(e) => {
                  setSelectedBlocked(e.target.value as any)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white appearance-none"
              >
                <option value="all">Все</option>
                <option value="active">Активные</option>
                <option value="blocked">Заблокированные</option>
              </select>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-end text-gray-400 text-sm">
              Показано: {users.length} из {total}
            </div>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Дата регистрации
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user: AdminUser, index: number) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/admin/users/${user.id}`} className="flex items-center hover:opacity-80 transition-opacity">
                        <UserAvatar
                          displayName={user.displayName}
                          avatarUrl={user.profile?.avatarUrl}
                          size="sm"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-white">
                            {user.displayName}
                          </div>
                          {user.profile?.firstName || user.profile?.lastName ? (
                            <div className="text-sm text-gray-400">
                              {user.profile.firstName} {user.profile.lastName}
                            </div>
                          ) : null}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                        {user.role === 'producer' && <Music className="h-3 w-3 mr-1" />}
                        {user.role === 'user' && <UserIcon className="h-3 w-3 mr-1" />}
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isBlocked ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/50">
                          <XCircle className="h-3 w-3 mr-1" />
                          Заблокирован
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/50">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Активен
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block">
                        <button
                          onClick={() =>
                            setActionMenuOpen(
                              actionMenuOpen === user.id ? null : user.id
                            )
                          }
                          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-400" />
                        </button>

                        {actionMenuOpen === user.id && (
                          <div className="absolute right-0 mt-2 w-56 bg-gray-700 rounded-lg shadow-lg border border-gray-600 z-10">
                            <div className="py-1">
                              {/* Block/Unblock */}
                              {user.isBlocked ? (
                                <button
                                  onClick={() => handleBlockUser(user.id, false)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 flex items-center"
                                >
                                  <Unlock className="h-4 w-4 mr-2" />
                                  Разблокировать
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleBlockUser(user.id, true)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 flex items-center"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Заблокировать
                                </button>
                              )}

                              {/* Change Role */}
                              <div className="border-t border-gray-600 my-1"></div>
                              <div className="px-4 py-2 text-xs text-gray-400 uppercase">
                                Изменить роль
                              </div>
                              <button
                                onClick={() => handleChangeRole(user.id, 'user')}
                                disabled={user.role === 'user'}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                                  user.role === 'user'
                                    ? 'text-gray-500 cursor-not-allowed'
                                    : 'text-gray-300 hover:bg-gray-600'
                                }`}
                              >
                                <UserIcon className="h-4 w-4 mr-2" />
                                Пользователь
                                {user.role === 'user' && <span className="ml-auto text-xs">(текущая)</span>}
                              </button>
                              <button
                                onClick={() => handleChangeRole(user.id, 'producer')}
                                disabled={user.role === 'producer'}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                                  user.role === 'producer'
                                    ? 'text-gray-500 cursor-not-allowed'
                                    : 'text-gray-300 hover:bg-gray-600'
                                }`}
                              >
                                <Music className="h-4 w-4 mr-2" />
                                Продюсер
                                {user.role === 'producer' && <span className="ml-auto text-xs">(текущая)</span>}
                              </button>
                              <button
                                onClick={() => handleChangeRole(user.id, 'admin')}
                                disabled={user.role === 'admin'}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                                  user.role === 'admin'
                                    ? 'text-gray-500 cursor-not-allowed'
                                    : 'text-gray-300 hover:bg-gray-600'
                                }`}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Администратор
                                {user.role === 'admin' && <span className="ml-auto text-xs">(текущая)</span>}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-700/50 px-6 py-4 flex items-center justify-between border-t border-gray-700">
              <div className="text-sm text-gray-400">
                Страница {currentPage} из {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-300" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-gray-300" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Click outside to close menu */}
      {actionMenuOpen !== null && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActionMenuOpen(null)}
        />
      )}
    </div>
  )
}

export default AdminUsersPage
