'use client'

import { Pause, Play, Volume2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Slider } from '@/components/ui/slider'

interface VoiceMessageProps {
  url: string
  duration?: number
  isOwn?: boolean
}

export function VoiceMessage({ url, duration = 0, isOwn }: VoiceMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch((err) => console.error('[VoiceMessage] Play failed:', err))
    }
  }, [isPlaying])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  return (
    <div className={`flex items-center gap-3 min-w-[160px] md:min-w-[200px] py-1`}>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
      />
      
      <button
        onClick={togglePlay}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
          isOwn 
            ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="h-4 w-4 fill-current translate-x-0.5" />
        )}
      </button>

      <div className="flex flex-1 flex-col gap-1 pr-1">
        <Slider
          value={[currentTime]}
          max={audioDuration || 100}
          step={0.1}
          onValueChange={([val]) => {
            if (audioRef.current) {
              audioRef.current.currentTime = val
              setCurrentTime(val)
            }
          }}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] tabular-nums opacity-70">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
      </div>
      
      <Volume2 className="h-3 w-3 shrink-0 opacity-40" />
    </div>
  )
}
