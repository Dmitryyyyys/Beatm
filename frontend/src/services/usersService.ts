import api from './api'

export interface UserProfile {
  id: number
  userId: number
  firstName?: string
  lastName?: string
  phone?: string
  country?: string
  city?: string
  bio?: string
  avatarUrl?: string
  bannerUrl?: string
  createdAt: string
  updatedAt: string
}

export interface PublicUser {
  id: number
  displayName: string
  role: 'admin' | 'producer' | 'user'
  createdAt: string
  profile: UserProfile | null
}

export interface AdminUser {
  id: number
  email: string
  displayName: string
  role: 'admin' | 'producer' | 'user'
  isBlocked: boolean
  createdAt: string
  updatedAt: string
  profile: UserProfile | null
}

export interface UsersListResponse {
  users: AdminUser[]
  total: number
  page: number
  limit: number
}

export const usersService = {
  getPublicProfile: async (displayName: string): Promise<PublicUser> => {
    const response = await api.get<PublicUser>(`/users/public/${displayName}`)
    return response.data
  },

  getMyProfile: async () => {
    const response = await api.get<{ profile: UserProfile | null }>('/users/profile')
    return {
      profile: response.data.profile || null,
    }
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    const response = await api.put('/users/profile', data)
    return response.data
  },

  getAllUsers: async (params?: {
    page?: number
    limit?: number
    search?: string
    role?: 'admin' | 'producer' | 'user'
    isBlocked?: boolean
  }): Promise<UsersListResponse> => {
    const response = await api.get<UsersListResponse>('/users', { params })
    return response.data
  },

  blockUser: async (userId: number, isBlocked: boolean) => {
    const response = await api.post('/users/block', { userId, isBlocked })
    return response.data
  },

  updateUserRole: async (userId: number, role: 'admin' | 'producer' | 'user') => {
    const response = await api.put('/users/role', { userId, role })
    return response.data
  },

  getUserDetails: async (userId: number) => {
    const response = await api.get(`/users/${userId}/details`)
    return response.data
  },

  checkAvailability: async (email?: string, displayName?: string) => {
    const params: { email?: string; displayName?: string } = {}
    if (email) params.email = email
    if (displayName) params.displayName = displayName
    const response = await api.get<{
      emailAvailable?: boolean
      displayNameAvailable?: boolean
    }>('/users/check/availability', { params })
    return response.data
  },
}

