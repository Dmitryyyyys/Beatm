import api from './api'

export interface Review {
  id: number
  comment: string
  trackId: number
  userId: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
  user?: {
    id: number
    displayName: string
    role: string
  }
  replies?: Review[]
  parentId?: number
  likesCount?: number
  isLiked?: boolean
}

export interface CreateReviewDto {
  comment: string
  parentId?: number | null
}

export const reviewsService = {
  getByTrackId: async (trackId: number): Promise<Review[]> => {
    const response = await api.get<Review[]>(`/reviews/track/${trackId}`)
    return response.data
  },

  create: async (trackId: number, data: CreateReviewDto): Promise<Review> => {
    const response = await api.post<Review>(`/reviews/track/${trackId}`, data)
    return response.data
  },

  update: async (id: number, data: Partial<CreateReviewDto>): Promise<Review> => {
    const response = await api.patch<Review>(`/reviews/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/reviews/${id}`)
  },

  toggleLike: async (id: number): Promise<{ isLiked: boolean; likesCount: number }> => {
    const response = await api.post<{ isLiked: boolean; likesCount: number }>(`/reviews/${id}/like`)
    return response.data
  },
}

