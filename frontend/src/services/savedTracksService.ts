import api from './api'

export interface SavedTrack {
  id: number
  userId: number
  trackId: number
  savedAt: string
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

export const savedTracksService = {
  getMySavedTracks: async (): Promise<SavedTrack[]> => {
    const response = await api.get<SavedTrack[]>('/saved-tracks')
    return response.data
  },

  saveTrack: async (trackId: number): Promise<SavedTrack> => {
    const response = await api.post<SavedTrack>(`/saved-tracks/track/${trackId}`)
    return response.data
  },

  unsaveTrack: async (trackId: number): Promise<void> => {
    await api.delete(`/saved-tracks/track/${trackId}`)
  },

  checkSaved: async (trackId: number): Promise<boolean> => {
    const response = await api.get<{ isSaved: boolean }>(`/saved-tracks/track/${trackId}/check`)
    return response.data.isSaved
  },

  getSavedCount: async (trackId: number): Promise<number> => {
    const response = await api.get<{ count: number }>(`/saved-tracks/track/${trackId}/count`)
    return response.data.count
  },
}




