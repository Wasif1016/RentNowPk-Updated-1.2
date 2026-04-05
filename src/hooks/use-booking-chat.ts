'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { chatThreadChannelName } from '@/lib/chat/constants'
import { fetchChatMessages } from '@/lib/actions/chat'
import type { ChatMessageDto, MessageCursor } from '@/lib/db/chat'

export function isOptimisticMessageId(id: string): boolean {
  return id.startsWith('temp-')
}

function parseBroadcastRecord(payload: unknown): ChatMessageDto | null {
  if (!payload || typeof payload !== 'object') return null
  const p = payload as Record<string, unknown>
  const inner = p.payload
  let rec: Record<string, unknown> | null = null
  if (inner && typeof inner === 'object') {
    const pl = inner as Record<string, unknown>
    if (pl.record && typeof pl.record === 'object') {
      rec = pl.record as Record<string, unknown>
    }
  }
  if (!rec && p.record && typeof p.record === 'object') {
    rec = p.record as Record<string, unknown>
  }
  if (!rec) return null
  const id = rec.id
  const threadId = rec.thread_id
  const senderId = rec.sender_id
  const content = rec.content
  const createdAt = rec.created_at
  const deliveredAt = rec.delivered_at
  const seenAt = rec.seen_at
  if (
    typeof id !== 'string' ||
    typeof threadId !== 'string' ||
    typeof senderId !== 'string' ||
    typeof content !== 'string'
  ) {
    return null
  }
  const created =
    typeof createdAt === 'string'
      ? createdAt
      : createdAt instanceof Date
        ? createdAt.toISOString()
        : null
  if (!created) return null
  const delivered =
    typeof deliveredAt === 'string'
      ? deliveredAt
      : deliveredAt instanceof Date
        ? deliveredAt.toISOString()
        : null
  const seen =
    typeof seenAt === 'string'
      ? seenAt
      : seenAt instanceof Date
        ? seenAt.toISOString()
        : null
  return {
    id,
    threadId,
    senderId,
    content,
    createdAt: created,
    editedAt: null,
    deliveredAt: delivered,
    seenAt: seen,
  }
}

/** Thin wrapper around a Web Audio API generated tone (no asset needed). */
let _notifyAudio: HTMLAudioElement | null = null

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8
  const blockAlign = numChannels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = samples.length * bytesPerSample
  const headerSize = 44
  const buffer = new ArrayBuffer(headerSize + dataSize)
  const view = new DataView(buffer)

  // RIFF header
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  // fmt chunk
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)
  // data chunk
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)
  // int16 PCM samples
  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i])) * 0.8
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    offset += 2
  }
  return buffer
}

function getNotifySound(): HTMLAudioElement {
  if (!_notifyAudio) {
    const ctx = new AudioContext()
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length
      const env = t < 0.1 ? t / 0.1 : t > 0.5 ? (1 - t) / 0.5 : 1
      data[i] = Math.sin(2 * Math.PI * 440 * (i / ctx.sampleRate)) * env * 0.25
    }
    ctx.close()
    const wav = encodeWav(data, buf.sampleRate)
    const blob = new Blob([wav], { type: 'audio/wav' })
    _notifyAudio = new Audio(URL.createObjectURL(blob))
  }
  return _notifyAudio
}

export function useBookingChat(options: {
  bookingId: string
  threadId: string
  initialMessages: ChatMessageDto[]
  initialNextCursor: MessageCursor | null
  currentUserId: string
}) {
  const { bookingId, threadId, initialMessages, initialNextCursor, currentUserId } = options

  const [messages, setMessages] = useState<ChatMessageDto[]>(initialMessages)
  const [nextCursor, setNextCursor] = useState<MessageCursor | null>(
    initialNextCursor
  )
  const [loadingOlder, setLoadingOlder] = useState(false)
  const idsRef = useRef<Set<string>>(new Set(initialMessages.map((m) => m.id)))
  const soundPlayedRef = useRef<Set<string>>(new Set())
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    idsRef.current = new Set(initialMessages.map((m) => m.id))
    soundPlayedRef.current = new Set(initialMessages.map((m) => m.id))
    setMessages(initialMessages)
    setNextCursor(initialNextCursor)
  }, [bookingId, initialMessages, initialNextCursor])

  const refetchLatest = useCallback(async () => {
    const res = await fetchChatMessages(bookingId)
    if (!res.ok) return
    const incoming = res.messages
    setMessages(incoming)
    setNextCursor(res.nextCursor)
    idsRef.current = new Set(incoming.map((m) => m.id))
    for (const m of incoming) soundPlayedRef.current.add(m.id)
  }, [bookingId])

  const addOptimisticMessage = useCallback((msg: ChatMessageDto) => {
    idsRef.current.add(msg.id)
    soundPlayedRef.current.add(msg.id)
    setMessages((prev) =>
      [...prev, msg].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    )
  }, [])

  const replaceOptimisticMessage = useCallback(
    (tempId: string, real: ChatMessageDto) => {
      idsRef.current.delete(tempId)
      idsRef.current.add(real.id)
      soundPlayedRef.current.add(real.id)
      setMessages((prev) =>
        prev
          .map((m) => (m.id === tempId ? real : m))
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
      )
    },
    []
  )

  const removeOptimisticMessage = useCallback((tempId: string) => {
    idsRef.current.delete(tempId)
    setMessages((prev) => prev.filter((m) => m.id !== tempId))
  }, [])

  /** Optimistically update a message in-place (for edits). */
  const updateMessage = useCallback((messageId: string, patch: Partial<ChatMessageDto>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, ...patch } : m))
    )
  }, [])

  /** Remove a message optimistically (for delete). */
  const deleteMessage = useCallback((messageId: string) => {
    idsRef.current.delete(messageId)
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
  }, [])

  const loadOlder = useCallback(async () => {
    if (!nextCursor || loadingOlder) return
    setLoadingOlder(true)
    try {
      const res = await fetchChatMessages(bookingId, nextCursor)
      if (!res.ok) return
      const older = res.messages
      setMessages((prev) => {
        const merged = [...older, ...prev]
        const seen = new Set<string>()
        const out: ChatMessageDto[] = []
        for (const m of merged) {
          if (seen.has(m.id)) continue
          seen.add(m.id)
          out.push(m)
        }
        out.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        return out
      })
      for (const m of older) {
        idsRef.current.add(m.id)
        soundPlayedRef.current.add(m.id)
      }
      setNextCursor(res.nextCursor)
    } finally {
      setLoadingOlder(false)
    }
  }, [bookingId, nextCursor, loadingOlder])

  useEffect(() => {
    const supabase = createClient()
    const channelName = chatThreadChannelName(threadId)
    let cancelled = false

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      await supabase.realtime.setAuth(session?.access_token ?? '')
      if (cancelled) return

      const ch = supabase.channel(channelName, {
        config: { private: true },
      })
      channelRef.current = ch

      ch.on('broadcast', { event: 'INSERT' }, (payload) => {
        const dto = parseBroadcastRecord(payload)
        if (!dto || dto.threadId !== threadId) return
        // Play notify sound for inbound (not own) messages, when tab is visible
        if (
          dto.senderId !== currentUserId &&
          !soundPlayedRef.current.has(dto.id) &&
          document.visibilityState === 'visible'
        ) {
          soundPlayedRef.current.add(dto.id)
          try {
            getNotifySound().play().catch(() => {
              /* ignore autoplay block */
            })
          } catch {
            /* ignore */
          }
        }
        setMessages((prev) => {
          if (idsRef.current.has(dto.id)) {
            return prev
          }
          const withoutMatchingOptimistic = prev.filter(
            (m) =>
              !(
                isOptimisticMessageId(m.id) &&
                m.senderId === dto.senderId &&
                m.content === dto.content
              )
          )
          idsRef.current.add(dto.id)
          return [...withoutMatchingOptimistic, dto].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()
          )
        })
      })

      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void refetchLatest()
        }
      })
    })()

    return () => {
      cancelled = true
      const ch = channelRef.current
      channelRef.current = null
      if (ch) {
        void supabase.removeChannel(ch)
      }
    }
  }, [threadId, bookingId, refetchLatest, currentUserId])

  return {
    messages,
    nextCursor,
    loadingOlder,
    loadOlder,
    refetchLatest,
    addOptimisticMessage,
    replaceOptimisticMessage,
    removeOptimisticMessage,
    updateMessage,
    deleteMessage,
  }
}
