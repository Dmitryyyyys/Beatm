import api from './api'

export interface PlayHistoryItem {
  id: number
  userId: number
  trackId: number
  playedAt: string
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

export const playHistoryService = {
  getMyPlayHistory: async (limit?: number): Promise<PlayHistoryItem[]> => {
    const params = limit ? `?limit=${limit}` : ''
    const response = await api.get<PlayHistoryItem[]>(`/play-history${params}`)
    return response.data
  },

  recordPlay: async (trackId: number): Promise<PlayHistoryItem> => {
    const response = await api.post<PlayHistoryItem>(`/play-history/track/${trackId}`)
    return response.data
  },

  removeFromHistory: async (trackId: number): Promise<void> => {
    await api.delete(`/play-history/track/${trackId}`)
  },

  clearPlayHistory: async (): Promise<void> => {
    await api.delete('/play-history')
  },
}


