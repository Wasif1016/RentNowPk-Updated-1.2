'use client'

import { format, isSameDay } from 'date-fns'
import { Check, CheckCheck, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import {
  vendorAcceptBooking,
  vendorRejectBooking,
} from '@/lib/actions/booking-vendor-response'
import { markThreadRead } from '@/lib/actions/chat-read'
import { deleteChatMessage, editChatMessage, sendChatMessage, toggleReaction, type ReactionSummary } from '@/lib/actions/chat'
import { createOfferFromChat } from '@/lib/actions/booking-offers'
import { OfferDialog } from '@/components/chat/offer-dialog'
import {
  useBookingChat,
  isOptimisticMessageId,
} from '@/hooks/use-booking-chat'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
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
    typingUsers,
    onTextChange,
  } = useBookingChat({
    bookingId,
    threadId,
    initialMessages,
    initialNextCursor,
    currentUserId,
  })

  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [vendorActionLoading, setVendorActionLoading] = useState<
    'accept' | 'reject' | null
  >(null)
  const [offerOpen, setOfferOpen] = useState(false)

  // --- Edit state ---
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // --- Delete confirm state ---
  const [reactionsByMessage, setReactionsByMessage] = useState<
    Record<string, ReactionSummary[]>
  >({})

  const handleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const res = await toggleReaction(bookingId, messageId, emoji)
      if (!res.ok) return
      setReactionsByMessage((prev) => {
        const existing = prev[messageId] ?? []
        if (res.reacted) {
          return {
            ...prev,
            [messageId]: [
              ...existing.filter((r) => r.emoji !== emoji),
              { emoji, count: (existing.find((r) => r.emoji === emoji)?.count ?? 0) + 1, reacted: true },
            ],
          }
        }
        return {
          ...prev,
          [messageId]: existing
            .map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count - 1 }
                : r
            )
            .filter((r) => r.count > 0),
        }
      })
    },
    [bookingId]
  )
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

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

  const showVendorPendingActions =
    isVendor && bookingStatus === 'PENDING'

  async function handleSend() {
    const text = draft.trim()
    if (!text) return
    setError(null)

    const tempId = `temp-${crypto.randomUUID()}`
    const optimistic: ChatMessageDto = {
      id: tempId,
      threadId,
      senderId: currentUserId,
      content: text,
      createdAt: new Date().toISOString(),
      editedAt: null,
      deliveredAt: null,
      seenAt: null,
    }
    addOptimisticMessage(optimistic)
    setDraft('')

    const res = await sendChatMessage(bookingId, text)
    if (!res.ok) {
      removeOptimisticMessage(tempId)
      setError(res.error)
      return
    }
    replaceOptimisticMessage(tempId, res.message)
  }

  async function handleAccept() {
    setVendorActionLoading('accept')
    setError(null)
    try {
      const res = await vendorAcceptBooking(bookingId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setRejectOpen(false)
      router.refresh()
    } finally {
      setVendorActionLoading(null)
    }
  }

  async function handleRejectSubmit() {
    setVendorActionLoading('reject')
    setError(null)
    try {
      const res = await vendorRejectBooking(bookingId, rejectReason)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setRejectOpen(false)
      setRejectReason('')
      router.refresh()
    } finally {
      setVendorActionLoading(null)
    }
  }

  function startEdit(msg: ChatMessageDto) {
    setEditingMessageId(msg.id)
    setEditDraft(msg.content)
    setEditError(null)
  }

  async function handleEditSave(msgId: string) {
    setEditSaving(true)
    setEditError(null)
    try {
      const res = await editChatMessage(bookingId, msgId, editDraft)
      if (!res.ok) {
        setEditError(res.error)
        return
      }
      updateMessage(msgId, {
        content: res.message.content,
        editedAt: res.message.editedAt,
      })
      setEditingMessageId(null)
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDeleteConfirm(msgId: string) {
    setDeleteLoading(true)
    try {
      const res = await deleteChatMessage(bookingId, msgId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      deleteMessage(msgId)
      setDeleteConfirmId(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleShareLocation() {
    if (!navigator.geolocation) {
      setError('Location is not supported by your browser.')
      return
    }
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`
        void handleSendLocationMessage(mapsUrl)
      },
      () => {
        setError('Could not get your location. Please check your browser permissions.')
      }
    )
  }

  async function handleSendLocationMessage(mapsUrl: string) {
    const tempId = `temp-${crypto.randomUUID()}`
    const optimistic: ChatMessageDto = {
      id: tempId,
      threadId,
      senderId: currentUserId,
      content: mapsUrl,
      createdAt: new Date().toISOString(),
      editedAt: null,
      deliveredAt: null,
      seenAt: null,
    }
    addOptimisticMessage(optimistic)
    setDraft('')
    const res = await sendChatMessage(bookingId, mapsUrl)
    if (!res.ok) {
      removeOptimisticMessage(tempId)
      setError(res.error)
      return
    }
    replaceOptimisticMessage(tempId, res.message)
  }

  async function handleOfferSubmit(values: {
    vehicleId: string
    pricePerDay: string
    totalPrice: string
    note: string
  }) {
    const res = await createOfferFromChat(
      bookingId,
      values.vehicleId,
      values.pricePerDay,
      values.totalPrice,
      values.note
    )
    if (!res.ok) {
      setError(res.error)
      return
    }
    setOfferOpen(false)
  }

  const shellClass =
    layout === 'standalone'
      ? 'flex min-h-[min(70vh,560px)] flex-col rounded-xl border border-border bg-card'
      : 'flex min-h-0 flex-1 flex-col bg-background'

  return (
    <div className={shellClass}>
      <header className="border-border shrink-0 border-b px-4 py-3">
        <div className="flex flex-col gap-1">
          {layout === 'standalone' && backHref ? (
            <Link
              href={backHref}
              className="text-muted-foreground hover:text-foreground text-xs font-medium"
            >
              ← Back to bookings
            </Link>
          ) : null}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-lg font-semibold">{title}</h1>
              <p className="text-muted-foreground text-sm">{subtitle}</p>
            </div>
            {isVendor && bookingStatus === 'CONFIRMED' && (
              <Button
                type="button"
                size="sm"
                onClick={() => setOfferOpen(true)}
              >
                Send Offer
              </Button>
            )}
          </div>
        </div>
      </header>

      {showVendorPendingActions ? (
        <div className="border-border bg-muted/20 flex shrink-0 flex-wrap gap-2 border-b px-4 py-2">
          <Button
            type="button"
            size="sm"
            disabled={vendorActionLoading !== null}
            onClick={() => void handleAccept()}
          >
            {vendorActionLoading === 'accept' ? 'Accepting…' : 'Accept'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={vendorActionLoading !== null}
            onClick={() => setRejectOpen(true)}
          >
            Reject
          </Button>
        </div>
      ) : null}

      <ScrollArea className="min-h-0 flex-1 px-3 py-3">
        <div className="flex flex-col gap-3 pb-2">
          {nextCursor ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                disabled={loadingOlder}
                onClick={() => void loadOlder()}
              >
                {loadingOlder ? 'Loading…' : 'Load earlier messages'}
              </Button>
            </div>
          ) : null}
          {renderMessageList({
            messages,
            currentUserId,
            editingMessageId,
            editDraft,
            editSaving,
            editError,
            onEditDraftChange: setEditDraft,
            onEditSave: handleEditSave,
            onEditCancel: () => setEditingMessageId(null),
            onStartEdit: startEdit,
            onDeleteRequest: (id) => setDeleteConfirmId(id),
            reactionsByMessage,
            onReaction: handleReaction,
          })}
        </div>
      </ScrollArea>

      {error ? (
        <p className="text-destructive shrink-0 px-4 pb-1 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {typingUsers.length > 0 ? (
        <div className="text-muted-foreground px-4 py-0.5 text-xs italic">
          {typingUsers.length === 1 ? 'Someone is typing…' : 'Several people are typing…'}
        </div>
      ) : null}

      <footer className="border-border shrink-0 border-t p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              void onTextChange()
            }}
            placeholder="Type a message…"
            rows={2}
            className="min-h-0 flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSend()
              }
            }}
          />
          {bookingStatus === 'CONFIRMED' && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => void handleShareLocation()}
              title="Share current location"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            onClick={() => void handleSend()}
            disabled={!draft.trim()}
            className="shrink-0"
          >
            Send
          </Button>
        </div>
      </footer>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        rejectReason={rejectReason}
        onRejectReasonChange={setRejectReason}
        vendorActionLoading={vendorActionLoading}
        onSubmit={handleRejectSubmit}
      />
      <DeleteConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={(v) => { if (!v) setDeleteConfirmId(null) }}
        messageContent={
          deleteConfirmId
            ? (messages.find((m) => m.id === deleteConfirmId)?.content ?? '')
            : ''
        }
        loading={deleteLoading}
        onConfirm={() => {
          if (deleteConfirmId) void handleDeleteConfirm(deleteConfirmId)
        }}
      />

      <OfferDialog
        open={offerOpen}
        onOpenChange={setOfferOpen}
        vehicles={vehicles}
        onSubmit={handleOfferSubmit}
      />
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

type MessageListProps = {
  messages: ChatMessageDto[]
  currentUserId: string
  editingMessageId: string | null
  editDraft: string
  editSaving: boolean
  editError: string | null
  onEditDraftChange: (v: string) => void
  onEditSave: (msgId: string) => void
  onEditCancel: () => void
  onStartEdit: (msg: ChatMessageDto) => void
  onDeleteRequest: (msgId: string) => void
  reactionsByMessage: Record<string, ReactionSummary[]>
  onReaction: (messageId: string, emoji: string) => void
}

function renderMessageList(props: MessageListProps) {
  const { messages, currentUserId, editingMessageId, editDraft, editSaving, editError, onEditDraftChange, onEditSave, onEditCancel, onStartEdit, onDeleteRequest, reactionsByMessage, onReaction } = props

  const elements: React.ReactNode[] = []
  let lastDate: Date | null = null

  for (const msg of messages) {
    const msgDate = new Date(msg.createdAt)
    if (!lastDate || !isSameDay(lastDate, msgDate)) {
      elements.push(
        <DaySeparator key={`sep-${msg.id}`} date={msgDate} />
      )
      lastDate = msgDate
    }
    elements.push(
      <MessageBubbleItem
        key={msg.id}
        message={msg}
        isOwn={msg.senderId === currentUserId}
        pending={isOptimisticMessageId(msg.id)}
        editing={editingMessageId === msg.id}
        editDraft={editDraft}
        editSaving={editSaving}
        editError={editError}
        onEditDraftChange={onEditDraftChange}
        onEditSave={onEditSave}
        onEditCancel={onEditCancel}
        onStartEdit={onStartEdit}
        onDeleteRequest={onDeleteRequest}
        reactions={reactionsByMessage[msg.id] ?? []}
        onReaction={onReaction}
      />
    )
  }
  return elements
}

function DaySeparator({ date }: { date: Date }) {
  const now = new Date()
  const label =
    isSameDay(date, now)
      ? 'Today'
      : isSameDay(date, new Date(now.getTime() - 86_400_000))
        ? 'Yesterday'
        : format(date, 'MMMM d, yyyy')
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="bg-border h-px flex-1" />
      <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide px-2">
        {label}
      </span>
      <div className="bg-border h-px flex-1" />
    </div>
  )
}

type BubbleProps = {
  message: ChatMessageDto
  isOwn: boolean
  pending?: boolean
  editing: boolean
  editDraft: string
  editSaving: boolean
  editError: string | null
  onEditDraftChange: (v: string) => void
  onEditSave: (msgId: string) => void
  onEditCancel: () => void
  onStartEdit: (msg: ChatMessageDto) => void
  onDeleteRequest: (msgId: string) => void
  reactions: ReactionSummary[]
  onReaction: (messageId: string, emoji: string) => void
}

function MessageBubbleItem({
  message,
  isOwn,
  pending,
  editing,
  editDraft,
  editSaving,
  editError,
  onEditDraftChange,
  onEditSave,
  onEditCancel,
  onStartEdit,
  onDeleteRequest,
  reactions,
  onReaction,
}: BubbleProps) {
  const time = format(new Date(message.createdAt), 'MMM d, h:mm a')

  if (editing) {
    return (
      <div
        className={cn(
          'flex max-w-[min(100%,36rem)] flex-col gap-1.5',
          isOwn ? 'ml-auto items-end' : 'mr-auto items-start'
        )}
      >
        {editError ? (
          <p className="text-destructive text-xs">{editError}</p>
        ) : null}
        <Textarea
          value={editDraft}
          onChange={(e) => onEditDraftChange(e.target.value)}
          rows={3}
          className="min-h-0 flex-1"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void onEditSave(message.id)
            }
            if (e.key === 'Escape') onEditCancel()
          }}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => void onEditSave(message.id)}
            disabled={editSaving || !editDraft.trim()}
          >
            {editSaving ? 'Saving…' : 'Save'}
          </Button>
          <Button size="sm" variant="ghost" onClick={onEditCancel}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥']

  return (
    <div
      className={cn(
        'group flex max-w-[min(100%,36rem)] flex-col gap-0.5',
        isOwn ? 'ml-auto items-end' : 'mr-auto items-start'
      )}
    >
      <div className="relative">
        <div
          className={cn(
            'rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap',
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground',
            pending && 'opacity-80'
          )}
        >
          {message.content}
        </div>

        {/* Reaction picker — visible on hover for all messages */}
        {!pending && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity',
                  'p-1 -translate-y-1 rounded-full bg-muted text-muted-foreground hover:text-foreground'
                )}
                aria-label="Add reaction"
              >
                <SmileIcon />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="flex gap-0.5 p-1">
              {QUICK_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => onReaction(message.id, e)}
                  className="hover:bg-accent rounded px-1.5 py-1 text-base leading-none transition-colors"
                >
                  {e}
                </button>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {isOwn ? (
          <MessageOwnActions
            message={message}
            onEdit={() => onStartEdit(message)}
            onDelete={() => onDeleteRequest(message.id)}
          />
        ) : null}
      </div>

      {/* Reaction pills */}
      {reactions.length > 0 ? (
        <div className="flex flex-wrap gap-1 px-1">
          {reactions.map((r) => (
            <button
              key={r.emoji}
              onClick={() => onReaction(message.id, r.emoji)}
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors',
                r.reacted
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-muted bg-muted/50 text-muted-foreground hover:border-primary'
              )}
            >
              <span>{r.emoji}</span>
              <span>{r.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      <span className="text-muted-foreground flex items-center gap-0.5 px-1 text-[10px]">
        {!isOwn && message.seenAt ? (
          <CheckCheck className="text-primary h-3 w-3 shrink-0" aria-label="Seen" />
        ) : !isOwn ? (
          <Check className="text-muted-foreground h-3 w-3 shrink-0" aria-label="Delivered" />
        ) : null}
        <span>{time}</span>
        {message.editedAt ? (
          <span className="ml-1 italic">(edited)</span>
        ) : null}
      </span>
    </div>
  )
}

function MessageOwnActions({
  message,
  onEdit,
  onDelete,
}: {
  message: ChatMessageDto
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity',
            'p-1 -translate-y-1 translate-x-1 rounded-full bg-muted text-muted-foreground hover:text-foreground'
          )}
          aria-label="Message options"
        >
          <MoreIcon />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onEdit} disabled={isOptimisticMessageId(message.id)}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={onDelete}
          className="text-destructive focus:text-destructive"
          disabled={isOptimisticMessageId(message.id)}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SmileIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" x2="9.01" y1="9" y2="9" />
      <line x1="15" x2="15.01" y1="9" y2="9" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  )
}

function RejectDialog({
  open,
  onOpenChange,
  rejectReason,
  onRejectReasonChange,
  vendorActionLoading,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  rejectReason: string
  onRejectReasonChange: (v: string) => void
  vendorActionLoading: 'accept' | 'reject' | null
  onSubmit: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Decline booking</DialogTitle>
          <DialogDescription>
            The customer will see this reason in the chat.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="reject-reason">Reason</Label>
          <Textarea
            id="reject-reason"
            value={rejectReason}
            onChange={(e) => onRejectReasonChange(e.target.value)}
            rows={3}
            placeholder="Brief reason…"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={vendorActionLoading !== null || rejectReason.trim().length < 3}
            onClick={() => void onSubmit()}
          >
            {vendorActionLoading === 'reject' ? 'Declining…' : 'Decline'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  messageContent,
  loading,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  messageContent: string
  loading: boolean
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete message?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone. The message &ldquo;
            {messageContent.length > 60
              ? `${messageContent.slice(0, 60)}…`
              : messageContent}
            &rdquo; will be removed for everyone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => void onConfirm()}
            disabled={loading}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
