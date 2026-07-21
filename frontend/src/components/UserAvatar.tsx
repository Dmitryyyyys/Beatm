import { useState } from 'react'
import { Link } from 'react-router-dom'

interface UserAvatarProps {
  displayName: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  linkToProfile?: boolean
  showBorder?: boolean
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

const UserAvatar = ({
  displayName,
  avatarUrl,
  size = 'md',
  className = '',
  linkToProfile = true,
  showBorder = false,
}: UserAvatarProps) => {
  const [imageError, setImageError] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || name[0].toUpperCase()
  }

  const showAvatar = avatarUrl && !imageError

  const avatarContent = (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full 
        ${showAvatar ? 'bg-gray-700' : 'bg-gray-700'} 
        flex items-center justify-center 
        ${showBorder ? 'border-2 border-gray-800 shadow-md' : ''}
        ${linkToProfile ? 'hover:opacity-80 transition-opacity cursor-pointer' : ''}
        ${className}
        overflow-hidden
        flex-shrink-0
      `}
    >
      {showAvatar ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="font-semibold text-primary-400">
          {getInitials(displayName)}
        </span>
      )}
    </div>
  )

  if (linkToProfile) {
    return (
      <Link to={`/profile/${displayName}`} className="inline-block">
        {avatarContent}
      </Link>
    )
  }

  return avatarContent
}

export default UserAvatar
