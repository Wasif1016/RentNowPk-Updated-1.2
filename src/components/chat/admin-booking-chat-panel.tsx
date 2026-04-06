'use client'

import { format, isSameDay } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, X, SendHorizontal, Check, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useBookingChat, isOptimisticMessageId } from '@/hooks/use-booking-chat'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { VoiceMessage } from '@/components/chat/voice-message'
import { sendChatMessage, sendVoiceMessage } from '@/lib/actions/chat'
import type { ChatMessageDto, MessageCursor } from '@/lib/db/chat'

type Props = {
  bookingId: string
  threadId: string
  initialMessages: ChatMessageDto[]
  initialNextCursor: MessageCursor | null
  adminUserId: string
  customerUserId: string
  vendorUserId: string
  customerName: string
  vendorName: string
  vehicleName: string
}

export function AdminBookingChatPanel({
  bookingId,
  threadId,
  initialMessages,
  initialNextCursor,
  adminUserId,
  customerUserId,
  vendorUserId,
  customerName,
  vendorName,
  vehicleName,
}: Props) {
  const router = useRouter()
  const {
    messages,
    nextCursor,
    loadingOlder,
    loadOlder,
    refetchLatest,
    addOptimisticMessage,
    replaceOptimisticMessage,
    removeOptimisticMessage,
    setTyping,
    remoteTyping,
  } = useBookingChat({
    bookingId,
    threadId,
    initialMessages,
    initialNextCursor,
    currentUserId: adminUserId,
  })

  // Fallback Polling for Admins (in case Realtime Broadcast is restricted by RLS/Auth claims)
  useEffect(() => {
    const interval = setInterval(() => {
      void refetchLatest()
    }, 10000) // 10 seconds
    return () => clearInterval(interval)
  }, [refetchLatest])

  const [draft, setDraft] = useState('')
  const [isSendingVoice, setIsSendingVoice] = useState(false)
  const recorder = useAudioRecorder()
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
  }, [])

  useEffect(() => {
    scrollToBottom('auto')
  }, [scrollToBottom])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSendMessage = async () => {
    const text = draft.trim()
    if (!text) return

    const tempId = `temp-${crypto.randomUUID()}`
    const optimistic: ChatMessageDto = {
      id: tempId,
      threadId,
      senderId: adminUserId,
      content: text,
      createdAt: new Date().toISOString(),
      editedAt: null,
      deliveredAt: null,
      seenAt: null,
      messageType: 'TEXT',
      mediaUrl: null,
      audioDuration: null,
    }
    addOptimisticMessage(optimistic)
    setDraft('')

    const res = await sendChatMessage(bookingId, text)
    if (!res.ok) {
      removeOptimisticMessage(tempId)
      toast.error(res.error)
    } else {
      replaceOptimisticMessage(tempId, res.message)
    }
  }

  const handleSendVoice = async () => {
    try {
      const { blob, duration } = await recorder.stopRecording()
      if (duration < 1) return

      setIsSendingVoice(true)
      const localUrl = URL.createObjectURL(blob)
      const tempId = `temp-voice-${crypto.randomUUID()}`

      addOptimisticMessage({
        id: tempId,
        threadId,
        senderId: adminUserId,
        content: null,
        createdAt: new Date().toISOString(),
        editedAt: null,
        deliveredAt: null,
        seenAt: null,
        messageType: 'AUDIO',
        mediaUrl: localUrl,
        audioDuration: Math.round(duration),
      })

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onload = () => resolve(reader.result as string)
      })

      const res = await sendVoiceMessage(bookingId, base64, duration)
      if (!res.ok) {
        removeOptimisticMessage(tempId)
        toast.error(res.error)
      } else {
        replaceOptimisticMessage(tempId, res.message)
      }
      URL.revokeObjectURL(localUrl)
    } finally {
      setIsSendingVoice(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="border-border flex shrink-0 items-center justify-between border-b bg-card px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-1">
          <Link href="/admin/chat" className="text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase tracking-wider mb-0.5">
            ← Back to Chat Monitoring
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">
                {customerName} <span className="text-muted-foreground mx-2">↔</span> {vendorName}
              </h1>
              <p className="text-sm text-muted-foreground font-medium">Monitoring Chat for {vehicleName}</p>
            </div>
            <div className="flex gap-2">
               <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-[10px] font-bold uppercase">Admin Monitor</span>
            </div>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 px-4 py-6 h-[350px]">
        <div className="flex flex-col gap-4">
          {nextCursor && (
            <Button variant="ghost" size="sm" onClick={() => loadOlder()} disabled={loadingOlder}>
              {loadingOlder ? 'Loading...' : 'Load previous messages'}
            </Button>
          )}
          
          {messages.map((msg) => {
            const isOwn = msg.senderId === adminUserId
            const isCustomer = msg.senderId === customerUserId
            const isVendor = msg.senderId === vendorUserId
            
            // UI Logic: Customer = Left, Vendor & Admin = Right
            const alignRight = !isCustomer
            const isAdminMsg = msg.senderId !== customerUserId && msg.senderId !== vendorUserId
            const isMe = msg.senderId === adminUserId

            return (
              <div key={msg.id} className="flex w-full flex-col">
                <div 
                  className={cn(
                    "group flex max-w-[min(100%,36rem)] flex-col gap-0.5",
                    alignRight ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1 px-1">
                    {isMe ? "Admin (You)" : isCustomer ? `${customerName} (Customer)` : isVendor ? `${vendorName} (Vendor)` : isAdminMsg ? "Admin" : "System"}
                  </span>

                  <div className={cn(
                    "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap shadow-sm",
                    isCustomer ? "bg-muted text-foreground" : 
                    isVendor ? "bg-primary text-primary-foreground" :
                    "bg-destructive text-destructive-foreground", // Admin intervention is RED
                    isOptimisticMessageId(msg.id) && "opacity-60"
                  )}>
                    {msg.messageType === 'AUDIO' ? (
                      <VoiceMessage 
                        url={msg.mediaUrl || ''} 
                        duration={msg.audioDuration || 0} 
                        isOwn={alignRight} 
                      />
                    ) : (
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                    )}
                    
                    <div className={cn(
                      "flex items-center gap-1.5 mt-1 opacity-50 font-medium",
                      alignRight ? "justify-end" : "justify-start"
                    )}>
                      <span className="text-[9px] tabular-nums">
                        {format(new Date(msg.createdAt), 'h:mm a')}
                      </span>
                      {isMe && (
                        <span className="flex items-center gap-0.5">
                          {msg.seenAt ? <CheckCheck className="h-3 w-3" /> : msg.deliveredAt ? <Check className="h-3 w-3 text-current" /> : null}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {remoteTyping && (
        <div className="px-4 py-1">
          <p className="text-muted-foreground animate-pulse text-[10px] italic">Activity detected...</p>
        </div>
      )}

      <footer className="border-border shrink-0 border-t p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          {recorder.status === 'recording' ? (
            <div className="bg-muted flex flex-1 items-center gap-3 rounded-lg px-3 py-2">
              <div className="flex h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-xs font-medium tabular-nums">
                Recording: {Math.floor(recorder.duration / 60)}:{(recorder.duration % 60).toString().padStart(2, '0')}
              </span>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={recorder.cancelRecording}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-sm hover:brightness-110"
                onClick={handleSendVoice}
                disabled={isSendingVoice}
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="relative flex-1">
                <Textarea 
                  placeholder="Send a monitoring note or intervention..."
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value)
                    setTyping(e.target.value.length > 0)
                  }}
                  className="min-h-[44px] flex-1 resize-none pr-10 bg-background/50 focus-visible:bg-background"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1 h-8 w-8 text-primary hover:bg-primary/10"
                  onClick={handleSendMessage}
                  disabled={!draft.trim() || isSendingVoice}
                >
                  <SendHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-[44px] w-[44px] shrink-0 border-border bg-background/50 hover:bg-background"
                onClick={() => recorder.startRecording()}
                disabled={isSendingVoice}
              >
                <Mic className="h-5 w-5 text-muted-foreground" />
              </Button>
            </>
          )}
        </div>
      </footer>
    </div>
  )
}
