export interface User {
  id: number
  email: string
  displayName: string
  role: 'admin' | 'producer' | 'user'
  isBlocked: boolean
}

export interface Track {
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
  viewsCount?: number
  playCount?: number
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

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface AuthResponse {
  access_token: string
  user: {
    id: number
    email: string
    displayName: string
    role: string
  }
}
