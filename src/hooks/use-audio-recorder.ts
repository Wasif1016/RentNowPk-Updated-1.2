'use client'

import { useCallback, useRef, useState } from 'react'

export type AudioRecorderStatus = 'idle' | 'recording' | 'processing'

export function useAudioRecorder() {
  const [status, setStatus] = useState<AudioRecorderStatus>('idle')
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstart = () => {
        setStatus('recording')
        setDuration(0)
        timerRef.current = setInterval(() => {
          setDuration((prev) => prev + 1)
        }, 1000)
      }

      recorder.start()
    } catch (err) {
      console.error('[useAudioRecorder] Failed to start recording:', err)
      throw err
    }
  }, [])

  const stopRecording = useCallback((): Promise<{ blob: Blob; duration: number }> => {
    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        reject(new Error('No active recording'))
        return
      }

      recorder.onstop = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        const finalDuration = duration
        
        // Stop all tracks to release microphone
        recorder.stream.getTracks().forEach((track) => track.stop())
        
        setStatus('idle')
        setDuration(0)
        resolve({ blob, duration: finalDuration })
      }

      recorder.stop()
      setStatus('processing')
    })
  }, [duration])

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder) {
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((track) => track.stop())
        if (timerRef.current) clearInterval(timerRef.current)
        setStatus('idle')
        setDuration(0)
      }
      recorder.stop()
    }
  }, [])

  return {
    status,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}
