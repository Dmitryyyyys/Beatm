import { Play, Pause, X, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { useAudioPlayer } from '../contexts/AudioPlayerContext'
import { Link } from 'react-router-dom'
import { Music } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const MiniPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    isVisible,
    pauseTrack,
    resumeTrack,
    closePlayer,
    seekTo,
    setVolume: setAudioVolume,
    playNext,
    playPrevious,
    hasNext,
    hasPrevious,
  } = useAudioPlayer()

  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(0.7)
  const [isDragging, setIsDragging] = useState(false)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const volumeSliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (currentTrack && !isMuted) {
      setAudioVolume(volume)
    }
  }, [currentTrack, volume, isMuted, setAudioVolume])

  if (!isVisible || !currentTrack) {
    return null
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seekTo(percentage * duration)
  }

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeSliderRef.current) return
    const rect = volumeSliderRef.current.getBoundingClientRect()
    const newVolume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setVolume(newVolume)
    setIsMuted(false)
    setPreviousVolume(newVolume)
    setAudioVolume(newVolume)
  }

  const toggleMute = () => {
    if (isMuted) {
      const restore = previousVolume > 0 ? previousVolume : 0.7
      setIsMuted(false)
      setVolume(restore)
      setAudioVolume(restore)
    } else {
      setPreviousVolume(volume)
      setIsMuted(true)
      setAudioVolume(0)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-gradient-to-t from-gray-950 via-gray-900 to-gray-900/95 backdrop-blur-xl border-t border-gray-700/50 shadow-2xl shadow-black/50">
        {/* Progress bar */}
        <div
          ref={progressBarRef}
          className="h-1.5 bg-gray-800 cursor-pointer group relative -mt-px"
          onClick={handleProgressClick}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
        >
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 relative transition-[width] duration-100"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-primary-400 rounded-full shadow-lg shadow-primary-500/50 border-2 border-white transition-transform ${isDragging ? 'scale-125' : 'scale-0 group-hover:scale-100'}`} />
          </div>
        </div>

        {/* Main content */}
        <div className="flex items-center px-4 py-2.5 max-w-screen-2xl mx-auto gap-4">
          {/* Track info - left */}
          <div className="flex items-center gap-3 min-w-0 w-1/4">
            <Link to={`/tracks/${currentTrack.id}`} className="flex items-center gap-3 min-w-0 group">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-lg ring-1 ring-white/10">
                {currentTrack.coverUrl ? (
                  <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-600 to-purple-700 flex items-center justify-center">
                    <Music className="h-5 w-5 text-white/80" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate group-hover:text-primary-400 transition-colors">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {currentTrack.producer?.displayName || 'Unknown'}
                </p>
              </div>
            </Link>
          </div>

          {/* Controls - center */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="flex items-center gap-3">
              <button
                onClick={playPrevious}
                disabled={!hasPrevious}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous track"
              >
                <SkipBack className="h-4 w-4 fill-current" />
              </button>

              <button
                onClick={isPlaying ? pauseTrack : resumeTrack}
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 hover:scale-105 text-gray-900 flex items-center justify-center transition-all shadow-lg"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={playNext}
                disabled={!hasNext}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                aria-label="Next track"
              >
                <SkipForward className="h-4 w-4 fill-current" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume + close - right */}
          <div className="flex items-center gap-2 w-1/4 justify-end">
            <button
              onClick={toggleMute}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <div
              ref={volumeSliderRef}
              className="w-24 h-1.5 bg-gray-700 rounded-full cursor-pointer relative group"
              onClick={handleVolumeClick}
            >
              <div
                className="h-full bg-white/80 group-hover:bg-white rounded-full transition-all relative"
                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <button
              onClick={closePlayer}
              className="ml-3 w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MiniPlayer
