import api from './api'

export interface Favorite {
  id: number
  userId: number
  trackId: number
  addedAt: string
  track: {
    id: number
    title: string
    description?: string
    producerId: number
    categoryId?: number
    bpm?: number
    key?: string
    price: number
    fileUrl: string
    previewUrl?: string
    coverUrl?: string
    tags?: string[]
    isPublic: boolean
    createdAt: string
    updatedAt: string
    producer?: {
      id: number
      displayName: string
    }
    category?: {
      id: number
      name: string
      slug: string
    }
  }
}

export const favoritesService = {
  getMyFavorites: async (): Promise<Favorite[]> => {
    const response = await api.get<Favorite[]>('/favorites')
    return response.data
  },

  addToFavorites: async (trackId: number): Promise<Favorite> => {
    const response = await api.post<Favorite>(`/favorites/track/${trackId}`)
    return response.data
  },

  removeFromFavorites: async (trackId: number): Promise<void> => {
    await api.delete(`/favorites/track/${trackId}`)
  },

  checkFavorite: async (trackId: number): Promise<boolean> => {
    const response = await api.get<{ isFavorite: boolean }>(`/favorites/track/${trackId}/check`)
    return response.data.isFavorite
  },

  getFavoriteCount: async (trackId: number): Promise<number> => {
    const response = await api.get<{ count: number }>(`/favorites/track/${trackId}/count`)
    return response.data.count
  },

  getUserFavorites: async (userId: number): Promise<Favorite[]> => {
    const response = await api.get<Favorite[]>(`/favorites/user/${userId}`)
    return response.data
  },
}




