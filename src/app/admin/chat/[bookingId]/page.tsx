import { getRequiredUser } from '@/lib/auth/session'
import { getAdminChatContextForBooking, loadMessagesPage } from '@/lib/db/chat'
import { AdminBookingChatPanel } from '@/components/chat/admin-booking-chat-panel'
import { notFound } from 'next/navigation'

export default async function AdminChatMonitoringDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>
}) {
  const { bookingId } = await params
  const user = await getRequiredUser('ADMIN')

  const ctx = await getAdminChatContextForBooking({ bookingId })
  if (!ctx) {
    notFound()
  }

  // Load initial messages for SSR
  const { messages, nextCursor } = await loadMessagesPage(ctx.threadId)

  return (
    <AdminBookingChatPanel
      bookingId={ctx.bookingId}
      threadId={ctx.threadId}
      initialMessages={messages}
      initialNextCursor={nextCursor}
      adminUserId={user.id}
      customerUserId={ctx.customerUserId}
      vendorUserId={ctx.vendorUserId}
      customerName={ctx.customerName}
      vendorName={ctx.vendorName}
      vehicleName={ctx.vehicleName}
    />
  )
}
