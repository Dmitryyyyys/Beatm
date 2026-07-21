import api from './api'
import { Track } from '../types'

export interface TrackFilters {
  search?: string
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  bpm?: number
  minBpm?: number
  maxBpm?: number
  key?: string
  producerId?: number
  isPublic?: boolean
  freeOnly?: boolean
  sortBy?: 'popularity' | 'price' | 'newest' | 'priceAsc'
  page?: number
  limit?: number
}

export interface TracksResponse {
  tracks: (Track & {
    producer?: {
      id: number
      displayName: string
    }
    category?: {
      id: number
      name: string
      slug: string
    }
    reviewsCount?: number
  })[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const tracksService = {
  getAll: async (filters?: TrackFilters): Promise<TracksResponse> => {
    const response = await api.get<TracksResponse>('/tracks', {
      params: filters,
    })
    return response.data
  },

  getById: async (id: number): Promise<Track> => {
    const response = await api.get<Track>(`/tracks/${id}`)
    return response.data
  },

  create: async (trackData: {
    title: string
    description?: string
    categoryId?: number
    bpm?: number
    key?: string
    price: number
    fileUrl: string
    previewUrl?: string
    coverUrl?: string
    tags?: string[]
    isPublic?: boolean
  }): Promise<Track> => {
    const response = await api.post<Track>('/tracks', trackData)
    return response.data
  },

  update: async (id: number, trackData: {
    title?: string
    description?: string
    categoryId?: number | null
    bpm?: number
    key?: string
    price?: number
    fileUrl?: string
    previewUrl?: string
    coverUrl?: string
    tags?: string[]
    isPublic?: boolean
  }): Promise<Track> => {
    const response = await api.patch<Track>(`/tracks/${id}`, trackData)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tracks/${id}`)
  },

  incrementView: async (id: number): Promise<void> => {
    await api.post(`/tracks/${id}/view`)
  },

  incrementPlay: async (id: number): Promise<void> => {
    await api.post(`/tracks/${id}/play`)
  },

  getPlayCount: async (id: number): Promise<number> => {
    const response = await api.get<{ count: number }>(`/tracks/${id}/play-count`)
    return response.data.count
  },
}
