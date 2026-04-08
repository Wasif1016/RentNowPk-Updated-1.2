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
  const content = rec.content as string | null
  const messageType = (rec.message_type as 'TEXT' | 'AUDIO' | 'OFFER' | 'IMAGE') || 'TEXT'
  const mediaUrl = rec.media_url as string | null
  const audioDuration = typeof rec.audio_duration === 'number' ? rec.audio_duration : null
  const offer = rec.offer as any | null
  const createdAt = rec.created_at
  const deliveredAt = rec.delivered_at
  const seenAt = rec.seen_at
  if (
    typeof id !== 'string' ||
    typeof threadId !== 'string' ||
    typeof senderId !== 'string'
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
    messageType,
    mediaUrl,
    audioDuration,
    createdAt: created,
    editedAt: null,
    deliveredAt: delivered,
    seenAt: seen,
    offer: offer ? {
      id: offer.id,
      vehicleId: offer.vehicle_id,
      vehicleName: offer.vehicle_name,
      pricePerDay: offer.price_per_day,
      totalPrice: offer.total_price,
      note: offer.note,
      status: offer.status,
      senderId: offer.sender_id,
    } : null,
  }
}

/** Native sound from file. */
let _notifyAudio: HTMLAudioElement | null = null

function getNotifySound(): HTMLAudioElement {
  if (!_notifyAudio) {
    _notifyAudio = new Audio('/NoteGPT_Speech_1775637613457.mp3')
  }
  return _notifyAudio
}

async function showBrowserNotification(msg: ChatMessageDto) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const title = `New Message`
  const body = msg.messageType === 'TEXT' ? msg.content : `Sent a ${msg.messageType.toLowerCase()}`
  
  try {
    new Notification(title, {
      body: body || 'You have a new message',
      icon: '/favicon.ico', // Universal fallback
      tag: msg.threadId, // Coalesce notifications for the same thread
    })
  } catch (err) {
    console.warn('Failed to show notification:', err)
  }
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
  const [nextCursor, setNextCursor] = useState<MessageCursor | null>(initialNextCursor)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [remoteTyping, setRemoteTyping] = useState(false)
  
  const idsRef = useRef<Set<string>>(new Set(initialMessages.map((m) => m.id)))
  const soundPlayedRef = useRef<Set<string>>(new Set())
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Permission request
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission()
    }
  }, [])

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
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    )
  }, [])

  const replaceOptimisticMessage = useCallback((tempId: string, real: ChatMessageDto) => {
    idsRef.current.delete(tempId)
    idsRef.current.add(real.id)
    soundPlayedRef.current.add(real.id)
    setMessages((prev) =>
      prev
        .map((m) => (m.id === tempId ? real : m))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    )
  }, [])

  const removeOptimisticMessage = useCallback((tempId: string) => {
    idsRef.current.delete(tempId)
    setMessages((prev) => prev.filter((m) => m.id !== tempId))
  }, [])

  const updateMessage = useCallback((messageId: string, patch: Partial<ChatMessageDto>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, ...patch } : m))
    )
  }, [])

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
        const seenSet = new Set<string>()
        const out: ChatMessageDto[] = []
        for (const m of merged) {
          if (seenSet.has(m.id)) continue
          seenSet.add(m.id)
          out.push(m)
        }
        out.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
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

  const setTyping = useCallback(
    (isTyping: boolean) => {
      const ch = channelRef.current
      if (!ch) return
      void ch.send({
        type: 'broadcast',
        event: 'TYPING',
        payload: { userId: currentUserId, isTyping },
      })
    },
    [currentUserId]
  )

  useEffect(() => {
    const supabase = createClient()
    const channelName = chatThreadChannelName(threadId)
    let cancelled = false

    void (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      await supabase.realtime.setAuth(session?.access_token ?? '')
      if (cancelled) return

      const ch = supabase.channel(channelName, { config: { private: true } })
      channelRef.current = ch

      ch.on('broadcast', { event: 'INSERT' }, (payload) => {
        const dto = parseBroadcastRecord(payload)
        if (!dto || dto.threadId !== threadId) return
        
        if (
          dto.senderId !== currentUserId &&
          !soundPlayedRef.current.has(dto.id)
        ) {
          soundPlayedRef.current.add(dto.id)
          try {
            getNotifySound().play().catch(() => {})
          } catch {}
          
          // Only show notification if tab is hidden OR not focusing this thread
          if (document.visibilityState !== 'visible') {
            void showBrowserNotification(dto)
          }
        }

        setMessages((prev) => {
          if (idsRef.current.has(dto.id)) return prev
          
          const withoutMatchingOptimistic = prev.filter(
            (m) => !(isOptimisticMessageId(m.id) && m.senderId === dto.senderId && m.content === dto.content)
          )
          idsRef.current.add(dto.id)
          return [...withoutMatchingOptimistic, dto].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        })
      })

      ch.on('broadcast', { event: 'THREAD_READ' }, (payload: any) => {
        const data = payload.payload?.payload || payload.payload
        if (!data || data.userId === currentUserId) return

        const at = new Date(data.at).getTime()
        setMessages((prev) =>
          prev.map((m) => {
            if (m.senderId === currentUserId && !m.seenAt && new Date(m.createdAt).getTime() <= at) {
              return { ...m, seenAt: data.at }
            }
            return m
          })
        )
      })

      ch.on('broadcast', { event: 'TYPING' }, (payload: any) => {
        const data = payload.payload
        if (!data || data.userId === currentUserId) return

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

        if (data.isTyping) {
          setRemoteTyping(true)
          typingTimeoutRef.current = setTimeout(() => setRemoteTyping(false), 3500)
        } else {
          setRemoteTyping(false)
        }
      })

      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') void refetchLatest()
      })
    })()

    return () => {
      cancelled = true
      const ch = channelRef.current
      channelRef.current = null
      if (ch) void supabase.removeChannel(ch)
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
    setTyping,
    remoteTyping,
  }
}
