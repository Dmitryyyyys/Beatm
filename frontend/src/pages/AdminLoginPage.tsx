import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react'
import { authService, LoginData } from '../services/authService'

const AdminLoginPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  })
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authService.login(formData)
      if (response.user.role === 'admin') {
        navigate('/')
      } else {
        setError('У вас нет доступа к админ-панели')
        authService.logout()
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Неверный email или пароль. Попробуйте еще раз.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-6">
            <Shield className="h-12 w-12 text-primary-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Панель администратора
          </h2>
          <p className="text-gray-400">Войдите для управления системой</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email администратора
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="admin@beatstore.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Вход...</span>
              ) : (
                <>
                  <span>Войти в админ-панель</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              ← Вернуться на главную
            </a>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-xs text-center text-gray-500">
          Доступ к панели администратора разрешен только авторизованным администраторам системы
        </p>
      </div>
    </div>
  )
}

export default AdminLoginPage

