import api from './api'

export interface ProducerAnalytics {
  totalLikes: number
  totalViews: number
  totalPlays: number
  totalSaves: number
  totalComments: number
  totalDownloads: number
  totalSubscribers: number
  trackAnalytics: TrackAnalytics[]
  overview: {
    totalTracks: number
    averageLikesPerTrack: number
    averageViewsPerTrack: number
    averagePlaysPerTrack: number
    averageSavesPerTrack: number
    averageCommentsPerTrack: number
  }
}

export interface TrackAnalytics {
  trackId: number
  trackTitle: string
  likes: number
  views: number
  plays: number
  saves: number
  comments: number
  downloads: number
  createdAt: string
}

export interface AdminStatistics {
  stats: {
    newUsersToday: number
    newUsersWeek: number
    newTracksToday: number
    newTracksWeek: number
    totalTracks: number
    activeProducers: number
    monthlyRevenue: number
  }
  charts: {
    activity: Array<{
      date: string
      plays: number
      downloads: number
      purchases: number
      likes: number
      comments: number
      users: number
    }>
    userGrowth: Array<{
      date: string
      users: number
    }>
  }
}

export const analyticsService = {
  getProducerAnalytics: async (): Promise<ProducerAnalytics> => {
    const response = await api.get<ProducerAnalytics>('/analytics/producer')
    return response.data
  },
  getAdminStatistics: async (): Promise<AdminStatistics> => {
    const response = await api.get<AdminStatistics>('/analytics/admin')
    return response.data
  },
}

