import api from './api'
import { Category } from '../types'

export interface CreateCategoryData {
  name: string
  slug: string
  description?: string
}

export interface UpdateCategoryData {
  name?: string
  slug?: string
  description?: string
}

export const categoriesService = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/categories')
    return response.data
  },

  getBySlug: async (slug: string): Promise<Category> => {
    const response = await api.get<Category>(`/categories/slug/${slug}`)
    return response.data
  },

  findOrCreate: async (name: string): Promise<Category> => {
    const response = await api.post<Category>('/categories/find-or-create', { name })
    return response.data
  },

  create: async (data: CreateCategoryData): Promise<Category> => {
    const response = await api.post<Category>('/categories', data)
    return response.data
  },

  update: async (id: number, data: UpdateCategoryData): Promise<Category> => {
    const response = await api.patch<Category>(`/categories/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`)
  },
}
