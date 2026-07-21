import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { Track } from '../types'
import { authService } from '../services/authService'
import { playHistoryService } from '../services/playHistoryService'
import { tracksService } from '../services/tracksService'
import { purchasesService } from '../services/purchasesService'

interface AudioPlayerContextType {
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  isVisible: boolean
  playTrack: (track: Track, queue?: Track[]) => Promise<void>
  pauseTrack: () => void
  resumeTrack: () => void
  closePlayer: () => void
  seekTo: (time: number) => void
  setVolume: (volume: number) => void
  getAudioElement: () => HTMLAudioElement | null
  playNext: () => void
  playPrevious: () => void
  hasNext: boolean
  hasPrevious: boolean
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined)

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext)
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider')
  }
  return context
}

interface AudioPlayerProviderProps {
  children: ReactNode
}

export const AudioPlayerProvider = ({ children }: AudioPlayerProviderProps) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [queue, setQueue] = useState<Track[]>([])
  const [queueIndex, setQueueIndex] = useState(-1)
  const [purchasedIds, setPurchasedIds] = useState<Set<number>>(new Set())
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const hasNext = queueIndex >= 0 && queueIndex < queue.length - 1
  const hasPrevious = queueIndex > 0

  useEffect(() => {
    const user = authService.getCurrentUser()
    if (user) {
      purchasesService.getMyPurchases()
        .then((purchases) => setPurchasedIds(new Set(purchases.map((p) => p.trackId))))
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause()
        audioElementRef.current.src = ''
        audioElementRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    if (audioElementRef.current) {
      const updateTime = () => {
        if (audioElementRef.current) {
          setCurrentTime(audioElementRef.current.currentTime)
          if (audioElementRef.current.duration && !isNaN(audioElementRef.current.duration)) {
            setDuration(audioElementRef.current.duration)
          }
        }
      }

      intervalRef.current = setInterval(updateTime, 100)

      const audio = audioElementRef.current

      const handleLoadedMetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setDuration(audio.duration)
        }
      }

      const handleLoadedData = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setDuration(audio.duration)
        }
      }

      const handleCanPlay = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setDuration(audio.duration)
        }
      }

      const handleEnded = () => {
        if (queueIndex >= 0 && queueIndex < queue.length - 1) {
          const nextTrack = queue[queueIndex + 1]
          setQueueIndex(queueIndex + 1)
          playTrack(nextTrack)
          return
        }
        setIsPlaying(false)
        setCurrentTime(0)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }

      const handlePlay = () => {
        setIsPlaying(true)
      }

      const handlePause = () => {
        setIsPlaying(false)
      }

      const handleError = (e: Event) => {
        console.error('Audio error:', e)
        setIsPlaying(false)
      }

      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.addEventListener('loadeddata', handleLoadedData)
      audio.addEventListener('canplay', handleCanPlay)
      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('play', handlePlay)
      audio.addEventListener('pause', handlePause)
      audio.addEventListener('error', handleError)
      audio.addEventListener('timeupdate', updateTime)

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.removeEventListener('loadeddata', handleLoadedData)
        audio.removeEventListener('canplay', handleCanPlay)
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('play', handlePlay)
        audio.removeEventListener('pause', handlePause)
        audio.removeEventListener('error', handleError)
        audio.removeEventListener('timeupdate', updateTime)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [audioElementRef.current])

  const playTrack = async (track: Track, newQueue?: Track[]) => {
    if (newQueue) {
      setQueue(newQueue)
      const idx = newQueue.findIndex((t) => t.id === track.id)
      setQueueIndex(idx >= 0 ? idx : 0)
    } else if (!queue.find((t) => t.id === track.id)) {
      setQueue([track])
      setQueueIndex(0)
    } else {
      setQueueIndex(queue.findIndex((t) => t.id === track.id))
    }

    if (currentTrack?.id === track.id && audioElementRef.current) {
      if (audioElementRef.current.paused) {
        try {
          await audioElementRef.current.play()
          setIsPlaying(true)
        } catch (error) {
          console.error('Failed to resume track:', error)
        }
      }
      setIsVisible(true)
      return
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current.src = ''
      audioElementRef.current = null
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    const isPurchased = purchasedIds.has(track.id)
    const audioUrl = isPurchased ? (track.fileUrl || track.previewUrl) : (track.previewUrl || track.fileUrl)
    if (!audioUrl) {
      console.error('No audio URL available for track')
      return
    }

    const audio = new Audio(audioUrl)
    audio.preload = 'auto'
    audio.crossOrigin = 'anonymous'
    
    audio.volume = 0.7

    audioElementRef.current = audio
    
    try {
      await new Promise<void>((resolve, reject) => {
        const handleCanPlay = () => {
          audio.removeEventListener('canplay', handleCanPlay)
          audio.removeEventListener('error', handleError)
          resolve()
        }

        const handleError = (e: Event) => {
          audio.removeEventListener('canplay', handleCanPlay)
          audio.removeEventListener('error', handleError)
          reject(e)
        }

        audio.addEventListener('canplay', handleCanPlay)
        audio.addEventListener('error', handleError)

        if (audio.readyState >= 3) {
          handleCanPlay()
        }
      })

      await audio.play()
      setCurrentTrack(track)
      setIsPlaying(true)
      setIsVisible(true)
      setCurrentTime(0)

      const currentUser = authService.getCurrentUser()
      
      if (currentUser && currentUser.role !== 'admin') {
        try {
          await tracksService.incrementPlay(track.id)
        } catch (error) {
          console.error('Failed to increment play count:', error)
        }
      }

      if (currentUser && currentUser.role !== 'admin') {
        try {
          await playHistoryService.recordPlay(track.id)
        } catch (error) {
          console.error('Failed to record play history:', error)
        }
      }
    } catch (error) {
      console.error('Failed to play track:', error)
      setIsPlaying(false)
      audioElementRef.current = null
    }
  }

  const pauseTrack = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      setIsPlaying(false)
    }
  }

  const resumeTrack = async () => {
    if (audioElementRef.current) {
      try {
        await audioElementRef.current.play()
        setIsPlaying(true)
      } catch (error) {
        console.error('Failed to resume track:', error)
      }
    }
  }

  const closePlayer = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current.src = ''
      audioElementRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setCurrentTrack(null)
    setIsPlaying(false)
    setIsVisible(false)
    setCurrentTime(0)
    setDuration(0)
  }

  const seekTo = (time: number) => {
    if (audioElementRef.current && duration > 0) {
      const seekTime = Math.max(0, Math.min(time, duration))
      audioElementRef.current.currentTime = seekTime
      setCurrentTime(seekTime)
    }
  }

  const setVolume = (volume: number) => {
    if (audioElementRef.current) {
      const clampedVolume = Math.max(0, Math.min(1, volume))
      audioElementRef.current.volume = clampedVolume
    }
  }

  const playNext = () => {
    if (hasNext) {
      const nextTrack = queue[queueIndex + 1]
      setQueueIndex(queueIndex + 1)
      playTrack(nextTrack)
    }
  }

  const playPrevious = () => {
    if (hasPrevious) {
      const prevTrack = queue[queueIndex - 1]
      setQueueIndex(queueIndex - 1)
      playTrack(prevTrack)
    }
  }

  const getAudioElement = () => {
    return audioElementRef.current
  }

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        isVisible,
        playTrack,
        pauseTrack,
        resumeTrack,
        closePlayer,
        seekTo,
        setVolume,
        getAudioElement,
        playNext,
        playPrevious,
        hasNext,
        hasPrevious,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  )
}

