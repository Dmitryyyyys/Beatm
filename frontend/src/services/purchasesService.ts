import api from './api'

export interface Purchase {
  id: number
  userId: number
  trackId: number
  purchasePrice: number
  purchasedAt: string
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

export const purchasesService = {
  getMyPurchases: async (): Promise<Purchase[]> => {
    const response = await api.get<Purchase[]>('/purchases')
    return response.data
  },

  purchaseTrack: async (trackId: number): Promise<Purchase> => {
    const response = await api.post<Purchase>(`/purchases/track/${trackId}`)
    return response.data
  },

  checkPurchase: async (trackId: number): Promise<boolean> => {
    const response = await api.get<{ isPurchased: boolean }>(`/purchases/track/${trackId}/check`)
    return response.data.isPurchased
  },
}

