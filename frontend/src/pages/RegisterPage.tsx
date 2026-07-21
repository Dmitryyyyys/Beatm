import { useState, FormEvent, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Music, Mail, Lock, User, ArrowRight, CheckCircle, XCircle } from 'lucide-react'
import { authService, RegisterData } from '../services/authService'
import { usersService } from '../services/usersService'

const RegisterPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const roleParam = searchParams.get('role')
  const next = searchParams.get('next') || '/'
  
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    displayName: '',
    role: roleParam === 'producer' ? 'producer' : 'user',
  })

  // Update role when URL parameter changes
  useEffect(() => {
    if (roleParam === 'producer') {
      setFormData(prev => ({ ...prev, role: 'producer' }))
    }
  }, [roleParam])

  // Validate email with debounce
  useEffect(() => {
    if (emailDebounceRef.current) {
      clearTimeout(emailDebounceRef.current)
    }

    if (!formData.email) {
      setEmailError('')
      setEmailAvailable(null)
      setEmailValidating(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setEmailError('Неверный формат email')
      setEmailAvailable(false)
      setEmailValidating(false)
      return
    }

    setEmailValidating(true)
    setEmailError('')

    emailDebounceRef.current = setTimeout(async () => {
      try {
        const result = await usersService.checkAvailability(formData.email, undefined)
        if (result.emailAvailable === false) {
          setEmailError('Этот email уже используется')
          setEmailAvailable(false)
        } else {
          setEmailError('')
          setEmailAvailable(true)
        }
      } catch (err) {
        setEmailError('Ошибка проверки email')
        setEmailAvailable(false)
      } finally {
        setEmailValidating(false)
      }
    }, 500)

    return () => {
      if (emailDebounceRef.current) {
        clearTimeout(emailDebounceRef.current)
      }
    }
  }, [formData.email])

  useEffect(() => {
    if (displayNameDebounceRef.current) {
      clearTimeout(displayNameDebounceRef.current)
    }

    const value = formData.displayName.trim()

    if (!value) {
      setDisplayNameError('')
      setDisplayNameAvailable(null)
      setDisplayNameValidating(false)
      return
    }

    if (value.length < 3) {
      setDisplayNameError('Минимум 3 символа')
      setDisplayNameAvailable(false)
      setDisplayNameValidating(false)
      return
    }

    if (/^[0-9]+$/.test(value)) {
      setDisplayNameError('Имя пользователя не может состоять только из цифр')
      setDisplayNameAvailable(false)
      setDisplayNameValidating(false)
      return
    }

    setDisplayNameValidating(true)
    setDisplayNameError('')

    displayNameDebounceRef.current = setTimeout(async () => {
      try {
        const result = await usersService.checkAvailability(undefined, value)
        if (result.displayNameAvailable === false) {
          setDisplayNameError('Это имя пользователя уже занято')
          setDisplayNameAvailable(false)
        } else {
          setDisplayNameError('')
          setDisplayNameAvailable(true)
        }
      } catch (err) {
        setDisplayNameError('Ошибка проверки имени пользователя')
        setDisplayNameAvailable(false)
      } finally {
        setDisplayNameValidating(false)
      }
    }, 500)

    return () => {
      if (displayNameDebounceRef.current) {
        clearTimeout(displayNameDebounceRef.current)
      }
    }
  }, [formData.displayName])
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState<string>('')
  const [displayNameError, setDisplayNameError] = useState<string>('')
  const [emailValidating, setEmailValidating] = useState(false)
  const [displayNameValidating, setDisplayNameValidating] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const [displayNameAvailable, setDisplayNameAvailable] = useState<boolean | null>(null)

  const emailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const displayNameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // Check if there are validation errors
    if (emailError || displayNameError || emailAvailable === false || displayNameAvailable === false) {
      setError('Пожалуйста, исправьте ошибки в форме')
      return
    }

    if (emailValidating || displayNameValidating) {
      setError('Пожалуйста, дождитесь завершения проверки')
      return
    }

    setLoading(true)

    try {
      await authService.register(formData)
      navigate(next.startsWith('/') ? next : '/')
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ошибка при регистрации. Попробуйте еще раз.'
      
      // Try to parse which field has the error
      if (errorMessage.toLowerCase().includes('email')) {
        setEmailError('Этот email уже используется')
        setEmailAvailable(false)
      } else if (errorMessage.toLowerCase().includes('display name') || errorMessage.toLowerCase().includes('имя')) {
        setDisplayNameError('Это имя пользователя уже занято')
        setDisplayNameAvailable(false)
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-[100dvh] overflow-y-auto bg-gray-900 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="max-w-md w-full mx-auto space-y-5 min-h-full flex flex-col justify-center">
        {/* Logo and Title */}
        <div className="text-center">
          <Link to="/" className="flex justify-center items-center space-x-2 mb-6">
            <Music className="h-10 w-10 text-primary-600" />
          </Link>
          <h2 className="text-2xl font-bold text-white mb-2">
            Создайте новый аккаунт
          </h2>
          <p className="text-gray-300">Начните продавать свои биты или покупать треки</p>
        </div>

        {/* Register Form */}
        <div className="bg-gray-800 rounded-2xl shadow-xl px-6 sm:px-7 pt-6 sm:pt-7 pb-10 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Display Name Field */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                Имя пользователя
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="displayName"
                  type="text"
                  required
                  minLength={3}
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-gray-900 text-white placeholder-gray-400 ${
                    displayNameError || displayNameAvailable === false
                      ? 'border-red-500 focus:ring-red-500'
                      : displayNameAvailable === true
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-gray-700 focus:ring-primary-500'
                  }`}
                  placeholder="johndoe"
                />
                {displayNameValidating && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                  </div>
                )}
                {!displayNameValidating && displayNameAvailable === true && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-5 w-5" />
                )}
                {!displayNameValidating && displayNameAvailable === false && (
                  <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 h-5 w-5" />
                )}
              </div>
              {displayNameError && (
                <p className="mt-1 text-xs text-red-400">{displayNameError}</p>
              )}
              {displayNameAvailable === true && !displayNameError && (
                <p className="mt-1 text-xs text-green-400">Имя пользователя доступно</p>
              )}
            </div>

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
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-gray-900 text-white placeholder-gray-400 ${
                    emailError || emailAvailable === false
                      ? 'border-red-500 focus:ring-red-500'
                      : emailAvailable === true
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
                {!emailValidating && emailAvailable === true && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-5 w-5" />
                )}
                {!emailValidating && emailAvailable === false && (
                  <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 h-5 w-5" />
                )}
              </div>
              {emailError && (
                <p className="mt-1 text-xs text-red-400">{emailError}</p>
              )}
              {emailAvailable === true && !emailError && (
                <p className="mt-1 text-xs text-green-400">Email доступен</p>
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
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Минимум 6 символов</p>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Выберите тип аккаунта
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'user' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.role === 'user'
                      ? 'border-primary-500 bg-primary-600'
                      : 'border-gray-700 hover:border-gray-700'
                  }`}
                >
                  <div className="font-semibold text-white mb-1">Покупатель</div>
                  <div className="text-xs text-gray-300">Покупайте биты</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'producer' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.role === 'producer'
                      ? 'border-primary-500 bg-primary-600'
                      : 'border-gray-700 hover:border-gray-700'
                  }`}
                >
                  <div className="font-semibold text-white mb-1">Продюсер</div>
                  <div className="text-xs text-gray-300">Продавайте биты</div>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || emailValidating || displayNameValidating || emailAvailable === false || displayNameAvailable === false || !!emailError || !!displayNameError}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Регистрация...</span>
              ) : (
                <>
                  <span>Создать аккаунт</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 space-y-4 text-center">
            <p className="text-sm text-gray-300">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold">
                Войти
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

export default RegisterPage

