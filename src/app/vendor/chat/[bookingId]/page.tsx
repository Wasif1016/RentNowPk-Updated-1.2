import { notFound } from 'next/navigation'
import { getRequiredUser } from '@/lib/auth/session'
import { BookingChatPanel } from '@/components/chat/booking-chat-panel'
import { BookingChatShell } from '@/components/chat/booking-chat-shell'
import {
  getChatContextForBooking,
  listBookingChatsForVendor,
  loadMessagesPage,
} from '@/lib/db/chat'
import { listVendorVehiclesForOffer } from '@/lib/db/vendor-vehicles'
import { db } from '@/lib/db'
import { vendorProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export default async function VendorChatThreadPage({
  params,
}: {
  params: Promise<{ bookingId: string }>
}) {
  const { bookingId } = await params
  const user = await getRequiredUser('VENDOR')
  const ctx = await getChatContextForBooking({ bookingId, userId: user.id })
  if (!ctx) {
    notFound()
  }

  const rows = await listBookingChatsForVendor(user.id)
  const { messages, nextCursor } = await loadMessagesPage(ctx.threadId)

  const [vp] = await db
    .select({ id: vendorProfiles.id })
    .from(vendorProfiles)
    .where(eq(vendorProfiles.userId, user.id))
    .limit(1)

  const vehicles = vp ? await listVendorVehiclesForOffer(vp.id) : []

  return (
    <BookingChatShell rows={rows} basePath="/vendor/chat">
      <BookingChatPanel
        bookingId={ctx.bookingId}
        threadId={ctx.threadId}
        initialMessages={messages}
        initialNextCursor={nextCursor}
        currentUserId={user.id}
        title={ctx.vehicleName}
        subtitle={`${ctx.otherPartyName} · ${ctx.status.replace(/_/g, ' ')}`}
        layout="standalone"
        backHref="/vendor/chat"
        bookingStatus={ctx.status}
        isVendor
        vehicles={vehicles}
        pickupAt={ctx.pickupAt}
        dropoffAt={ctx.dropoffAt}
        pickupAddress={ctx.pickupAddress}
        vehicleCoverUrl={ctx.vehicleCoverUrl}
      />
    </BookingChatShell>
  )
}
