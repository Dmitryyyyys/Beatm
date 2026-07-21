import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Camera } from 'lucide-react'
import { usersService } from '../services/usersService'
import { authService } from '../services/authService'

interface ProfileData {
  firstName?: string
  lastName?: string
  phone?: string
  country: string
  city?: string
  bio?: string
  avatarUrl?: string
  bannerUrl?: string
}

const SettingsProfilePage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    country: '',
  })
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const currentUser = authService.getCurrentUser()

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login')
      return
    }

    const loadProfile = async () => {
      try {
        setLoading(true)
        setError('')
        const userData = await usersService.getMyProfile()
        console.log('Profile data received:', userData)
        
        if (userData && userData.profile) {
          setProfile({
            firstName: userData.profile.firstName || '',
            lastName: userData.profile.lastName || '',
            phone: userData.profile.phone || '',
            country: userData.profile.country || '',
            city: userData.profile.city || '',
            bio: userData.profile.bio || '',
            avatarUrl: userData.profile.avatarUrl || '',
            bannerUrl: userData.profile.bannerUrl || '',
          })
        } else {
          // Профиль может быть null, это нормально для нового пользователя
          setProfile({
            country: '',
          })
        }
      } catch (error: any) {
        console.error('Failed to load profile:', error)
        console.error('Error response:', error.response)
        const errorMessage = error.response?.data?.message || error.message || 'Не удалось загрузить профиль'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [navigate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // В реальном приложении здесь должна быть загрузка на сервер
      // Пока используем временный URL для предпросмотра
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, avatarUrl: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // В реальном приложении здесь должна быть загрузка на сервер
      // Пока используем временный URL для предпросмотра
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, bannerUrl: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      await usersService.updateProfile(profile)
      setSuccess('Профиль успешно обновлен!')
      setTimeout(() => {
        if (currentUser) {
          navigate(`/profile/${currentUser.displayName}`)
        }
      }, 1500)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось обновить профиль')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Загрузка настроек...</p>
        </div>
      </div>
    )
  }

  const initials = currentUser?.displayName
    ? currentUser.displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || currentUser.displayName[0].toUpperCase()
    : '?'

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Настройка профиля</h1>
          <p className="text-gray-300 mt-2">Управляйте информацией о себе</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Banner Upload */}
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="relative h-48 bg-gradient-to-r from-primary-600 via-primary-700 to-purple-700">
              {profile.bannerUrl && (
                <img
                  src={profile.bannerUrl}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="hidden"
                  />
                  <div className="bg-gray-800 bg-opacity-90 hover:bg-opacity-100 rounded-lg px-4 py-2 flex items-center space-x-2 transition-all">
                    <Camera className="h-5 w-5 text-gray-300" />
                    <span className="text-sm font-medium text-gray-300">
                      {profile.bannerUrl ? 'Изменить баннер' : 'Загрузить баннер'}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Avatar */}
            <div className="px-6 pb-6 -mt-16 relative">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full bg-gray-700 border-4 border-gray-800 shadow-lg flex items-center justify-center text-4xl font-bold text-primary-400 overflow-hidden">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-primary-600 text-white rounded-full p-2 cursor-pointer hover:bg-primary-700 transition-colors shadow-lg">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Camera className="h-5 w-5" />
                </label>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
            {error && (
              <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-900 bg-opacity-50 border border-green-700 text-green-200 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                  Имя
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                  placeholder="Имя"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                  Фамилия
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                  placeholder="Фамилия"
                />
              </div>
            </div>

            {/* Country (Required) */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">
                Страна <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="country"
                name="country"
                required
                value={profile.country}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                placeholder="Страна"
              />
            </div>

            {/* City (Optional) */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
                Город
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={profile.city}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                placeholder="Город"
              />
            </div>

            {/* Phone (Optional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                Телефон
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={profile.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                placeholder="+7 (999) 999-99-99"
              />
            </div>

            {/* Bio (Optional) */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
                Описание профиля
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                value={profile.bio}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                placeholder="Расскажите о себе..."
                maxLength={1000}
              />
              <p className="mt-1 text-xs text-gray-400">
                {profile.bio?.length || 0} / 1000 символов
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={saving || !profile.country}
                className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Сохранение...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Сохранить</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SettingsProfilePage

