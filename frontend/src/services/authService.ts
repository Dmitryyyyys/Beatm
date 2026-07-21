import api from './api'
import { AuthResponse } from '../types'

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  displayName: string
  role?: 'user' | 'producer'
}

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data)
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data)
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  },

  logout(): void {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
    return null
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token')
  },

  isAdmin(): boolean {
    const user = this.getCurrentUser()
    return user?.role === 'admin'
  },
}

