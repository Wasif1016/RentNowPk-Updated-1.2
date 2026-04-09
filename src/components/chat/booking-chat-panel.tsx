'use client'

import { format, isSameDay } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  vendorAcceptBooking,
  vendorRejectBooking,
} from '@/lib/actions/booking-vendor-response'
import { markThreadRead } from '@/lib/actions/chat-read'
import { deleteChatMessage, editChatMessage, sendChatMessage, sendVoiceMessage, sendImageMessage } from '@/lib/actions/chat'
import { createOfferFromChat, getVendorFleet } from '@/lib/actions/booking-offers'
import { OfferDialog } from '@/components/chat/offer-dialog'
import { OfferMessage } from '@/components/chat/offer-message'
import {
  useBookingChat,
  isOptimisticMessageId,
} from '@/hooks/use-booking-chat'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { VoiceMessage } from '@/components/chat/voice-message'
import { 
  Mic, 
  Square, 
  X, 
  SendHorizontal, 
  Check, 
  CheckCheck, 
  Paperclip, 
  Image as ImageIcon, 
  Loader2, 
  MoreVertical,
  ArrowLeft,
  Car,
  MapPin,
  AlertTriangle,
  MessageSquare,
  PlusCircle
} from 'lucide-react'
import { toast } from 'sonner'
import type { bookings } from '@/lib/db/schema'
import type { ChatMessageDto, MessageCursor } from '@/lib/db/chat'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type BookingStatus = (typeof bookings.$inferSelect)['status']

type Props = {
  bookingId: string
  threadId: string
  initialMessages: ChatMessageDto[]
  initialNextCursor: MessageCursor | null
  currentUserId: string
  title: string
  subtitle: string
  /** Standalone page: full card chrome + back link. Embedded: fills chat column only. */
  layout?: 'standalone' | 'embedded'
  backHref?: string
  bookingStatus: BookingStatus
  isVendor: boolean
  /** Vendor's fleet vehicles — used for Send Offer dialog. */
  vehicles?: { id: string; name: string }[]
  
  // Extra context for pinned card
  pickupAt?: Date
  dropoffAt?: Date
  pickupAddress?: string
  vehicleCoverUrl?: string | null
}

export function BookingChatPanel({
  bookingId,
  threadId,
  initialMessages,
  initialNextCursor,
  currentUserId,
  title,
  subtitle,
  layout = 'embedded',
  backHref,
  bookingStatus,
  isVendor,
  vehicles = [],
  pickupAt,
  dropoffAt,
  pickupAddress,
  vehicleCoverUrl,
}: Props) {
  const router = useRouter()
  const {
    messages,
    nextCursor,
    loadingOlder,
    loadOlder,
    addOptimisticMessage,
    replaceOptimisticMessage,
    removeOptimisticMessage,
    updateMessage,
    deleteMessage,
    setTyping,
    remoteTyping,
  } = useBookingChat({
    bookingId,
    threadId,
    initialMessages,
    initialNextCursor,
    currentUserId,
  })

  const [draft, setDraft] = useState('')
  const typingRef = useRef<boolean>(false)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleDraftChange = (val: string) => {
    setDraft(val)
    if (!typingRef.current) {
      typingRef.current = true
      setTyping(true)
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      typingRef.current = false
      setTyping(false)
    }, 2500)
  }
  const [error, setError] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [vendorActionLoading, setVendorActionLoading] = useState<'accept' | 'reject' | null>(null)
  const [offerOpen, setOfferOpen] = useState(false)
  const [internalVehicles, setInternalVehicles] = useState<{id: string, name: string}[]>(vehicles)

  useEffect(() => {
    if (vehicles.length === 0) {
      void getVendorFleet(bookingId).then(setInternalVehicles).catch(console.error)
    } else {
      setInternalVehicles(vehicles)
    }
  }, [bookingId, vehicles])

  const showVendorPendingActions =
    isVendor && bookingStatus === 'PENDING'

  // --- Edit state ---
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // --- Delete confirm state ---
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // --- Voice & File state ---
  const recorder = useAudioRecorder()
  const [isSendingVoice, setIsSendingVoice] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // --- Scrolling ---
  const bottomRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
  }, [])

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom('smooth')
    }
  }, [messages, scrollToBottom])

  useEffect(() => {
    let cancelled = false
    let debounceTimer: ReturnType<typeof setTimeout> | undefined

    const scheduleMarkRead = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        void markThreadRead(bookingId).then((res) => {
          if (cancelled || !res.ok) return
          router.refresh()
        })
      }, 300)
    }

    scheduleMarkRead()
    const onVis = () => {
      if (document.visibilityState === 'visible') scheduleMarkRead()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelled = true
      if (debounceTimer) clearTimeout(debounceTimer)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [bookingId, router])

  const handleSend = async () => {
    const val = draft.trim()
    if (!val) return
    setDraft('')
    const tempId = `temp-${Date.now()}`
    addOptimisticMessage({
      id: tempId,
      threadId,
      senderId: currentUserId,
      content: val,
      messageType: 'TEXT',
      mediaUrl: null,
      audioDuration: null,
      createdAt: new Date().toISOString(),
      editedAt: null,
      deliveredAt: null,
      seenAt: null,
    })
    const res = await sendChatMessage(bookingId, val)
    if (!res.ok) {
      removeOptimisticMessage(tempId)
    } else {
      replaceOptimisticMessage(tempId, res.message)
    }
  }

  const handleSendVoice = async () => {
    try {
      const { blob, duration } = await recorder.stopRecording()
      if (duration < 1) {
        toast.error('Recording too short')
        return
      }

      setIsSendingVoice(true)
      const localUrl = URL.createObjectURL(blob)
      const tempId = `temp-voice-${crypto.randomUUID()}`
      
      addOptimisticMessage({
        id: tempId,
        threadId,
        senderId: currentUserId,
        content: null,
        createdAt: new Date().toISOString(),
        editedAt: null,
        deliveredAt: null,
        seenAt: null,
        messageType: 'AUDIO',
        mediaUrl: localUrl,
        audioDuration: Math.round(duration),
      })
      
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
      })

      const res = await sendVoiceMessage(bookingId, base64, duration)
      if (!res.ok) {
        removeOptimisticMessage(tempId)
        toast.error(res.error)
      } else {
        replaceOptimisticMessage(tempId, res.message)
      }
      URL.revokeObjectURL(localUrl)
    } catch (err) {
      console.error('[handleSendVoice] Error:', err)
      toast.error('Failed to send voice message')
    } finally {
      setIsSendingVoice(false)
    }
  }

  const handleFileClick = () => {
    imageInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 3 * 1024 * 1024) {
      toast.error('File size must be less than 3MB')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only images (JPG, PNG, GIF, WebP, SVG) are allowed.')
      return
    }

    setIsUploadingFile(true)
    const tempId = `temp-img-${Date.now()}`

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result as string

      addOptimisticMessage({
        id: tempId,
        threadId,
        senderId: currentUserId,
        content: null,
        messageType: 'IMAGE',
        mediaUrl: base64,
        audioDuration: null,
        createdAt: new Date().toISOString(),
        editedAt: null,
        deliveredAt: null,
        seenAt: null,
      })

      const res = await sendImageMessage(bookingId, base64)
      if (!res.ok) {
        removeOptimisticMessage(tempId)
        toast.error(res.error)
      } else {
        replaceOptimisticMessage(tempId, res.message)
      }
      setIsUploadingFile(false)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col h-full bg-[#f9f9ff] text-[#071c36] font-sans">
      
      {/* Mobile-Only Header - Matches TopAppBar template if standalone */}
      {layout === 'standalone' && (
        <header className="bg-[#0B1F3A] border-b-2 border-[#000615] shadow-[8px_8px_0px_0px_rgba(0,6,21,1)] flex justify-between items-center px-4 h-16 w-full z-10 sticky top-0 md:hidden">
          <div className="flex items-center gap-4">
            <Link href={backHref || '/'} className="text-white p-1 hover:text-[#F5A623]">
              <ArrowLeft className="size-5" />
            </Link>
            <h1 className="text-[#F5A623] tracking-tighter uppercase font-bold text-lg truncate w-40">{title}</h1>
          </div>
          <button className="text-white p-1 hover:text-[#F5A623]">
            <MoreVertical className="size-5" />
          </button>
        </header>
      )}

      {/* Main Container - Desktop-safe height management */}
      <div className="flex-grow flex flex-col min-h-0 relative">
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-6 pb-4">
          
          <div className="max-w-xl mx-auto space-y-8">
            {/* Pinned Booking Card Context */}
            <section className="mb-8">
              <div className="bg-white border-2 border-[#000615] shadow-[8px_8px_0px_0px_rgba(0,6,21,1)] p-4 relative overflow-hidden group rounded-none">
                <div className="flex gap-4">
                  <div className="w-24 h-24 border-2 border-[#000615] shrink-0 bg-gray-50 flex items-center justify-center overflow-hidden rounded-none">
                    {vehicleCoverUrl ? (
                      <img src={vehicleCoverUrl} alt="Vehicle" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    ) : (
                      <Car className="text-4xl opacity-10 size-12" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold uppercase tracking-tight leading-loose">{title}</h3>
                      <span className="bg-[#feae2c] text-[#000615] text-[10px] font-bold px-2 py-0.5 border border-[#000615] uppercase shadow-[2px_2px_0px_0px_#000] rounded-none">
                         {bookingStatus.replace('_', ' ')}
                      </span>
                    </div>
                    {pickupAt && dropoffAt && (
                      <p className="text-[10px] font-bold text-[#071c36]/40 mt-1 uppercase tracking-widest leading-none">
                        {format(pickupAt, 'MMM d')} — {format(dropoffAt, 'MMM d, yyyy')}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                       <MapPin className="size-3 text-[#feae2c]" />
                       <span className="text-[11px] font-bold uppercase truncate max-w-[150px]">{pickupAddress || 'Pick-up info pending'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* System Warning Banner */}
            <div className="mb-6 bg-[#ffdad6] border-2 border-[#000615] p-3 flex items-start gap-3 shadow-[4px_4px_0px_0px_rgba(0,6,21,1)] rounded-none">
              <AlertTriangle className="text-[#ba1a1a] size-5" />
              <p className="text-[11px] font-bold text-[#93000a] leading-tight uppercase tracking-tight">
                SECURITY ALERT: Do not share phone numbers until confirmed. Out-of-platform transactions are not protected.
              </p>
            </div>

            {/* Chat Messages */}
            <div className="flex flex-col space-y-8 min-h-[400px]">
                {messages.length > 0 ? (
                  renderMessageList({
                    messages,
                    currentUserId,
                    editingMessageId,
                    editDraft,
                    editSaving,
                    editError,
                    onEditDraftChange: setEditDraft,
                    onEditSave: async (id: string) => {},
                    onEditCancel: () => setEditingMessageId(null),
                    onStartEdit: (m: ChatMessageDto) => {},
                    onDeleteRequest: (id: string) => setDeleteConfirmId(id)
                  })
                ) : (
                  <div className="py-20 flex flex-col items-center opacity-20">
                     <MessageSquare className="size-12 mb-4" />
                     <p className="font-bold uppercase tracking-widest text-sm">Beginning of thread</p>
                  </div>
                )}

               {/* Typing Indicator */}
               {remoteTyping && (
                 <div className="flex items-center gap-2 animate-pulse mt-4">
                    <div className="w-2 h-2 bg-[#000615]"></div>
                    <span className="text-[11px] font-bold italic uppercase tracking-tighter text-[#44474d]">{subtitle.split('·')[0].trim()} is typing...</span>
                 </div>
               )}
               <div ref={bottomRef} className="h-4" />
            </div>
          </div>
        </div>

        {/* Floating Vendor Actions */}
        {showVendorPendingActions && (
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
             <Button 
                onClick={() => setRejectOpen(true)}
                className="bg-white text-[#ba1a1a] border-2 border-[#000615] px-4 py-2 font-bold uppercase shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:shadow-none transition-all h-auto text-xs rounded-none"
             >
                Reject
             </Button>
             <Button 
                onClick={async () => {
                   setVendorActionLoading('accept')
                   await vendorAcceptBooking(bookingId)
                   setVendorActionLoading(null)
                   router.refresh()
                }}
                className="bg-[#feae2c] text-[#000615] border-2 border-[#000615] px-4 py-2 font-bold uppercase shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:shadow-none transition-all h-auto text-xs rounded-none"
             >
                {vendorActionLoading === 'accept' ? 'Acceting...' : 'Accept'}
             </Button>
          </div>
        )}

        {/* Bottom Input Area - Match template */}
        <div className="sticky bottom-0 w-full px-4 pb-6 pt-2 bg-[#f9f9ff]/80 backdrop-blur-sm z-30">
          <div className="max-w-xl mx-auto bg-white border-2 border-[#000615] shadow-[8px_8px_0px_0px_rgba(0,6,21,1)] flex items-center p-1 rounded-none">
             <button onClick={handleFileClick} className="p-3 text-[#000615] hover:bg-[#dee8ff] transition-colors">
               <PlusCircle className="size-5" />
             </button>
             <input 
               type="text" 
               value={draft}
               onChange={(e) => handleDraftChange(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               placeholder="WRITE A MESSAGE..."
               className="flex-grow bg-transparent border-none focus:ring-0 text-[10px] font-bold tracking-widest placeholder:text-[#000615]/20 px-3 uppercase h-10 rounded-none"
             />
             <button onClick={handleSend} className="bg-[#feae2c] text-primary border-l-2 border-primary px-6 py-3 hover:bg-primary hover:text-white transition-all active:translate-x-0.5 active:translate-y-0.5 rounded-none">
               <SendHorizontal className="size-5" />
             </button>
          </div>
        </div>
      </div>

      {/* Hidden inputs / helpers */}
      <input type="file" ref={imageInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />
    </div>
  )
}

interface RenderMessageListProps {
  messages: ChatMessageDto[]
  currentUserId: string
  editingMessageId: string | null
  editDraft: string
  editSaving: boolean
  editError: string | null
  onEditDraftChange: (val: string) => void
  onEditSave: (id: string) => Promise<void>
  onEditCancel: () => void
  onStartEdit: (m: ChatMessageDto) => void
  onDeleteRequest: (id: string) => void
}

function renderMessageList(props: RenderMessageListProps) {
  const { messages, currentUserId } = props
  const elements: React.ReactNode[] = []
  let lastDate: Date | null = null

  for (const msg of messages) {
    const msgDate = new Date(msg.createdAt)
    if (!lastDate || !isSameDay(lastDate, msgDate)) {
      elements.push(<div key={`sep-${msg.id}`} className="py-12 flex justify-center"><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#000615]/20 bg-[#f9f9ff] px-4">{format(msgDate, 'MMMM d, yyyy')}</span></div>)
      lastDate = msgDate
    }
    elements.push(<MessageBubble key={msg.id} msg={msg} isOwn={msg.senderId === currentUserId} />)
  }
  return elements
}

function MessageBubble({ msg, isOwn }: { msg: ChatMessageDto, isOwn: boolean }) {
  return (
    <div className={cn("flex flex-col group", isOwn ? "items-end self-end" : "items-start self-start")}>
      <div className="flex items-center gap-2 mb-2 px-1">
        {!isOwn && <span className="text-[10px] font-bold uppercase tracking-widest text-[#0B1F3A]">Recipient</span>}
        <span className="text-[9px] font-bold text-[#44474d]">{format(new Date(msg.createdAt), 'h:mm a')}</span>
        {isOwn && <span className="text-[10px] font-bold uppercase tracking-widest text-[#0B1F3A]">You</span>}
      </div>
      
      <div className={cn(
        "max-w-[85%] border-2 border-[#000615] p-4 transition-transform hover:scale-[1.01] rounded-none",
        isOwn 
          ? "bg-[#feae2c] text-[#000615] shadow-[4px_4px_0px_0px_#0B1F3A]" 
          : "bg-white text-[#000615] shadow-[4px_4px_0px_0px_#000]"
      )}>
        {msg.messageType === 'AUDIO' ? (
          <VoiceMessage url={msg.mediaUrl || ''} duration={msg.audioDuration || 0} isOwn={isOwn} />
        ) : msg.messageType === 'IMAGE' ? (
          <img src={msg.mediaUrl || ''} alt="Shared" className="max-w-full border-2 border-[#000615] shadow-[2px_2px_0px_0px_#000] rounded-none" />
        ) : msg.messageType === 'OFFER' ? (
          <OfferMessage message={msg} currentUserId={isOwn ? msg.senderId : ''} />
        ) : (
          <p className={cn("text-xs leading-relaxed font-bold", isOwn ? "tracking-tighter" : "tracking-normal")}>{msg.content}</p>
        )}
      </div>

      {isOwn && (
        <div className="mt-2 mr-1">
           {msg.seenAt ? (
             <CheckCheck className="text-xs text-[#F5A623] size-3" />
           ) : (
             <Check className="text-xs text-[#000615]/20 size-3" />
           )}
        </div>
      )}
    </div>
  )
}
