import { Suspense } from 'react'
import { listBookingChatsForAdmin } from '@/lib/db/chat'
import { getRequiredUser } from '@/lib/auth/session'
import { AdminBookingChatShell } from '@/components/chat/admin-booking-chat-shell'

export default async function AdminChatLayout({ children }: { children: React.ReactNode }) {
  await getRequiredUser('ADMIN')
  const rows = await listBookingChatsForAdmin()

  return (
    <Suspense fallback={<div className="flex-1 animate-pulse bg-muted/20" />}>
      <AdminBookingChatShell rows={rows} basePath="/admin/chat">
        {children}
      </AdminBookingChatShell>
    </Suspense>
  )
}
