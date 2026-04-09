import { notFound } from 'next/navigation'
import { getRequiredUser } from '@/lib/auth/session'
import { BookingChatPanel } from '@/components/chat/booking-chat-panel'
import { BookingChatShell } from '@/components/chat/booking-chat-shell'
import {
  getChatContextForBooking,
  listBookingChatsForCustomer,
  loadMessagesPage,
} from '@/lib/db/chat'

export default async function CustomerChatThreadPage({
  params,
}: {
  params: Promise<{ bookingId: string }>
}) {
  const { bookingId } = await params
  const user = await getRequiredUser('CUSTOMER')
  const ctx = await getChatContextForBooking({ bookingId, userId: user.id })
  if (!ctx) {
    notFound()
  }

  const rows = await listBookingChatsForCustomer(user.id)
  const { messages, nextCursor } = await loadMessagesPage(ctx.threadId)

  return (
    <BookingChatShell rows={rows} basePath="/customer/chat">
      <BookingChatPanel
        bookingId={ctx.bookingId}
        threadId={ctx.threadId}
        initialMessages={messages}
        initialNextCursor={nextCursor}
        currentUserId={user.id}
        title={ctx.vehicleName}
        subtitle={`${ctx.otherPartyName} · ${ctx.status.replace(/_/g, ' ')}`}
        layout="standalone"
        backHref="/customer/chat"
        bookingStatus={ctx.status}
        isVendor={false}
        pickupAt={ctx.pickupAt}
        dropoffAt={ctx.dropoffAt}
        pickupAddress={ctx.pickupAddress}
        vehicleCoverUrl={ctx.vehicleCoverUrl}
      />
    </BookingChatShell>
  )
}
