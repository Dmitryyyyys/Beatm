import api from './api'

export interface Subscription {
  id: number
  subscribedTo: {
    id: number
    displayName: string
    role: 'admin' | 'producer' | 'user'
    avatarUrl?: string
    country?: string
    city?: string
  }
  subscribedAt: string
}

export interface Follower {
  id: number
  subscriber: {
    id: number
    displayName: string
    role: 'admin' | 'producer' | 'user'
    avatarUrl?: string
    country?: string
    city?: string
  }
  subscribedAt: string
}

export const subscriptionsService = {
  getMySubscriptions: async (): Promise<Subscription[]> => {
    const response = await api.get<Subscription[]>('/subscriptions/my')
    return response.data
  },

  getMyFollowers: async (): Promise<Follower[]> => {
    const response = await api.get<Follower[]>('/subscriptions/followers')
    return response.data
  },

  checkSubscription: async (userId: number): Promise<boolean> => {
    const response = await api.get<{ isSubscribed: boolean }>(`/subscriptions/${userId}/check`)
    return response.data.isSubscribed
  },

  subscribe: async (userId: number): Promise<Subscription> => {
    const response = await api.post<Subscription>(`/subscriptions/${userId}`)
    return response.data
  },

  unsubscribe: async (userId: number): Promise<void> => {
    await api.delete(`/subscriptions/${userId}`)
  },

  getSubscriptionCount: async (userId: number): Promise<number> => {
    const response = await api.get<{ count: number }>(`/subscriptions/${userId}/count`)
    return response.data.count
  },
}

