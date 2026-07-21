import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, UserMinus } from 'lucide-react'
import { subscriptionsService } from '../services/subscriptionsService'
import { getCountryFlagUrl } from '../utils/countryFlags'

interface FollowerCardProps {
  user: {
    id: number
    displayName: string
    role: 'admin' | 'producer' | 'user'
    avatarUrl?: string
    country?: string
    city?: string
  }
  onSubscribeChange: () => void
}

const FollowerCard = ({ user, onSubscribeChange }: FollowerCardProps) => {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    subscriptionsService.checkSubscription(user.id).then((subscribed) => {
      setIsSubscribed(subscribed)
      setLoading(false)
    })
  }, [user.id])

  const handleToggleSubscribe = async () => {
    try {
      if (isSubscribed) {
        await subscriptionsService.unsubscribe(user.id)
        setIsSubscribed(false)
      } else {
        await subscriptionsService.subscribe(user.id)
        setIsSubscribed(true)
      }
      onSubscribeChange()
    } catch (error) {
      console.error('Failed to toggle subscription:', error)
    }
  }

  const initials = user.displayName[0].toUpperCase()

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors">
      <div className="flex items-start space-x-4 mb-4">
        <Link
          to={`/profile/${user.displayName}`}
          className="relative flex-shrink-0"
        >
          <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-primary-400 font-semibold text-xl">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          {user.country && getCountryFlagUrl(user.country) && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-800 border-2 border-gray-700">
              <img
                src={getCountryFlagUrl(user.country)!}
                alt={user.country}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            to={`/profile/${user.displayName}`}
            className="block"
          >
            <h3 className="font-semibold text-white truncate hover:text-primary-400 transition-colors">
              {user.displayName}
            </h3>
            <p className="text-sm text-gray-300 capitalize">{user.role}</p>
            {user.city && (
              <p className="text-sm text-gray-400">{user.city}</p>
            )}
          </Link>
        </div>
      </div>
      <button
        onClick={handleToggleSubscribe}
        disabled={loading}
        className={`w-full flex items-center justify-center space-x-2 px-4 py-2 font-medium rounded-lg transition-colors disabled:opacity-50 ${
          isSubscribed
            ? 'bg-gray-900 hover:bg-gray-700 text-white'
            : 'bg-primary-600 hover:bg-primary-700 text-white'
        }`}
      >
        {loading ? (
          <span>Загрузка...</span>
        ) : isSubscribed ? (
          <>
            <UserMinus className="h-4 w-4" />
            <span>Отписаться</span>
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            <span>Подписаться</span>
          </>
        )}
      </button>
    </div>
  )
}

export default FollowerCard

