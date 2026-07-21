import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Music, Menu, X, User, LogOut, Shield, Settings, ChevronDown, MessageSquare, Users, Heart, Clock, Plus, Bookmark, ShoppingBag, BarChart3, Tag } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { authService } from '../services/authService'
import UserAvatar from './UserAvatar'
import { usersService } from '../services/usersService'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (location.pathname === '/search') {
      const q = new URLSearchParams(location.search).get('q') || ''
      setSearchQuery(q)
    }
  }, [location.pathname, location.search])

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = authService.isAuthenticated()
      setIsAuthenticated(authenticated)
      if (authenticated) {
        const user = authService.getCurrentUser()
        setCurrentUser(user)
        try {
          if (user?.displayName) {
            const profileData = await usersService.getPublicProfile(user.displayName)
            setUserAvatarUrl(profileData.profile?.avatarUrl || null)
          }
        } catch (error) {
          console.error('Failed to load user profile:', error)
        }
      } else {
        setCurrentUser(null)
        setUserAvatarUrl(null)
      }
    }
    checkAuth()
    window.addEventListener('storage', checkAuth)
    return () => window.removeEventListener('storage', checkAuth)
  }, [location])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  const handleLogout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setCurrentUser(null)
    navigate('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    if (location.pathname === '/search') {
      navigate('/search')
    }
  }

  return (
    <header className="bg-gray-900 shadow-sm sticky top-0 z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <Music className="h-8 w-8 text-white" />
          </Link>

          <nav className="hidden md:flex items-center space-x-8 ml-8">
            <Link 
              to="/" 
              className="text-gray-300 hover:text-white font-medium transition-colors"
            >
              Главная
            </Link>
            <Link 
              to="/search" 
              className="text-gray-300 hover:text-white font-medium transition-colors"
            >
              Поиск битов
            </Link>
            {currentUser && currentUser.role === 'producer' && (
              <Link 
                to="/studio" 
                className="text-gray-300 hover:text-white font-medium transition-colors"
              >
                Студия
              </Link>
            )}
          </nav>

          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Поиск битов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-white placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Очистить поиск"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>
          </div>

          <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
            {isAuthenticated && currentUser ? (
              <>
                {currentUser.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1 text-gray-300 hover:text-white font-medium transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Админ</span>
                  </Link>
                )}
                {currentUser.role === 'producer' && (
                  <Link
                    to="/create-track"
                    className="flex items-center space-x-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Создать товар</span>
                  </Link>
                )}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors focus:outline-none"
                  >
                    <UserAvatar 
                      displayName={currentUser.displayName} 
                      avatarUrl={userAvatarUrl}
                      size="sm"
                      linkToProfile={false}
                    />
                    <span className="font-medium">{currentUser.displayName}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isUserMenuOpen ? 'transform rotate-180' : ''}`} />
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
                      {currentUser.role === 'admin' ? (
                        <>
                          <Link
                            to="/admin/users"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          >
                            <Users className="h-4 w-4" />
                            <span>Пользователи</span>
                          </Link>
                          <Link
                            to="/admin/categories"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          >
                            <Tag className="h-4 w-4" />
                            <span>Категории</span>
                          </Link>
                          <div className="border-t border-gray-700 my-1"></div>
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false)
                              handleLogout()
                            }}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-left"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Выйти</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            to={`/profile/${currentUser.displayName}`}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          >
                            <User className="h-4 w-4" />
                            <span>Мой профиль</span>
                          </Link>
                          <Link
                            to="/settings/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                            <span>Настройка профиля</span>
                          </Link>
                          <Link
                            to="/messenger"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span>Сообщения</span>
                          </Link>
                          <Link
                            to="/subscriptions"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          >
                            <Users className="h-4 w-4" />
                            <span>Подписки</span>
                          </Link>
                          <Link
                            to="/favorites"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          >
                            <Heart className="h-4 w-4" />
                            <span>Понравившиеся</span>
                          </Link>
                          <Link
                            to="/saved"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          >
                            <Bookmark className="h-4 w-4" />
                            <span>Сохраненные</span>
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          >
                            <ShoppingBag className="h-4 w-4" />
                            <span>Мои заказы</span>
                          </Link>
                          <Link
                            to="/recent"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          >
                            <Clock className="h-4 w-4" />
                            <span>Недавно прослушанные</span>
                          </Link>
                          {currentUser.role === 'producer' && (
                            <Link
                              to="/studio"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                            >
                              <BarChart3 className="h-4 w-4" />
                              <span>Студия</span>
                            </Link>
                          )}
                          <div className="border-t border-gray-700 my-1"></div>
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false)
                              handleLogout()
                            }}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-left"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Выйти</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white font-medium transition-colors"
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-gray-300 hover:text-white font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Главная
              </Link>
              <Link 
                to="/search" 
                className="text-gray-300 hover:text-white font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Поиск битов
              </Link>
              {currentUser && currentUser.role === 'producer' && (
                <>
                  <Link 
                    to="/studio" 
                    className="text-gray-300 hover:text-white font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Студия
                  </Link>
                  <Link 
                    to="/create-track" 
                    className="flex items-center space-x-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-center justify-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Создать товар</span>
                  </Link>
                </>
              )}
              
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Поиск битов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    aria-label="Очистить поиск"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </form>

              <div className="pt-4 border-t border-gray-800 space-y-2">
                {isAuthenticated && currentUser ? (
                  <>
                    {currentUser.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center space-x-1 text-gray-300 hover:text-white font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Shield className="h-4 w-4" />
                        <span>Админ-панель</span>
                      </Link>
                    )}
                    <Link
                      to={`/profile/${currentUser.displayName}`}
                      className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      <span className="font-medium">{currentUser.displayName}</span>
                    </Link>
                    <Link
                      to="/settings/profile"
                      className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Настройка профиля</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center space-x-1 w-full text-left text-gray-300 hover:text-red-400 font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Выйти</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block text-gray-300 hover:text-white font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Войти
                    </Link>
                    <Link
                      to="/register"
                      className="btn-primary inline-block text-center w-full"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Регистрация
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
