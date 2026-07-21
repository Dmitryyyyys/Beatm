import { useState, FormEvent, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Music, Mail, Lock, ArrowRight, CheckCircle, XCircle } from 'lucide-react'
import { authService, LoginData } from '../services/authService'

const LoginPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  })
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState<string>('')
  const [passwordError, setPasswordError] = useState<string>('')
  const [emailValid, setEmailValid] = useState<boolean | null>(null)
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null)
  const [emailValidating, setEmailValidating] = useState(false)

  const next = searchParams.get('next') || '/'
  const emailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (emailDebounceRef.current) {
      clearTimeout(emailDebounceRef.current)
    }

    if (!formData.email) {
      setEmailError('')
      setEmailValid(null)
      setEmailValidating(false)
      return
    }

    setEmailValidating(true)

    // Debounce - валидация через 300ms после остановки ввода
    emailDebounceRef.current = setTimeout(() => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setEmailError('Неверный формат email')
        setEmailValid(false)
      } else {
        setEmailError('')
        setEmailValid(true)
      }
      setEmailValidating(false)
    }, 300)

    return () => {
      if (emailDebounceRef.current) {
        clearTimeout(emailDebounceRef.current)
      }
    }
  }, [formData.email])

  useEffect(() => {
    if (!formData.password) {
      setPasswordError('')
      setPasswordValid(null)
      return
    }

    if (formData.password.length < 6) {
      setPasswordError('Пароль должен содержать минимум 6 символов')
      setPasswordValid(false)
    } else {
      setPasswordError('')
      setPasswordValid(true)
    }
  }, [formData.password])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (emailValidating) {
      setError('Пожалуйста, дождитесь завершения проверки')
      return
    }

    setLoading(true)

    try {
      await authService.login(formData)
      navigate(next)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Неверный email или пароль. Попробуйте еще раз.'
      setError(errorMessage)

      setFormData((prev) => ({ ...prev, password: '' }))
      setPasswordValid(null)
      setPasswordError('')
      if (errorMessage.toLowerCase().includes('credentials') || errorMessage.toLowerCase().includes('неверный')) {
        setEmailError('')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <Link to="/" className="flex justify-center items-center space-x-2 mb-6">
            <Music className="h-10 w-10 text-primary-600" />
          </Link>
          <h2 className="text-2xl font-bold text-white mb-2">
            Вход в аккаунт
          </h2>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800 rounded-2xl shadow-xl px-8 pt-8 pb-10 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    setError('') // Clear general error when user starts typing
                  }}
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-gray-900 text-white placeholder-gray-400 ${
                    emailError || emailValid === false
                      ? 'border-red-500 focus:ring-red-500'
                      : emailValid === true
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-gray-700 focus:ring-primary-500'
                  }`}
                  placeholder="your@email.com"
                />
                {emailValidating && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                  </div>
                )}
                {!emailValidating && emailValid === true && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-5 w-5" />
                )}
                {!emailValidating && emailValid === false && (
                  <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 h-5 w-5" />
                )}
              </div>
              {emailError && (
                <p className="mt-1 text-xs text-red-400">{emailError}</p>
              )}
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
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    setError('') // Clear general error when user starts typing
                  }}
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-gray-900 text-white placeholder-gray-400 ${
                    passwordError || passwordValid === false
                      ? 'border-red-500 focus:ring-red-500'
                      : passwordValid === true
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-gray-700 focus:ring-primary-500'
                  }`}
                  placeholder="••••••••"
                />
                {passwordValid === true && !passwordError && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-5 w-5" />
                )}
                {passwordValid === false && passwordError && (
                  <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 h-5 w-5" />
                )}
              </div>
              {passwordError && (
                <p className="mt-1 text-xs text-red-400">{passwordError}</p>
              )}
              {passwordValid === true && !passwordError && formData.password.length >= 6 && (
                <p className="mt-1 text-xs text-green-400">Пароль подходит</p>
              )}
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
                  <span>Войти</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 space-y-4 text-center">
            <p className="text-sm text-gray-300">
              Нет аккаунта?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold">
                Зарегистрироваться
              </Link>
            </p>
            <Link to="/" className="inline-block text-sm text-gray-400 hover:text-gray-300 transition-colors">
              ← Вернуться на главную
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

export default LoginPage

