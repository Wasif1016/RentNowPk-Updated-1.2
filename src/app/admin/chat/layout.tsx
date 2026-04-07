import { Suspense } from 'react'
import { listBookingChatsForAdmin } from '@/lib/db/chat'
import { getRequiredUser } from '@/lib/auth/session'
import { AdminBookingChatShell } from '@/components/chat/admin-booking-chat-shell'

export default async function AdminChatLayout({ children }: { children: React.ReactNode }) {
  await getRequiredUser('ADMIN')
  const rows = await listBookingChatsForAdmin()

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="px-6 pt-6 pb-2 lg:px-8 bg-card/70 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Messages</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Monitor conversations across the platform</p>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 mt-4 mx-4 lg:mx-6 mb-6">
        <Suspense fallback={<div className="flex-1 animate-pulse bg-muted/20 rounded-2xl" />}>
          <AdminBookingChatShell rows={rows} basePath="/admin/chat">
            {children}
          </AdminBookingChatShell>
        </Suspense>
      </div>
    </div>
  )
}
