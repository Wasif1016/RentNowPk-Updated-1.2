'use client'

import { useParams } from 'next/navigation'
import type { AdminChatListRow } from '@/lib/db/chat'
import { AdminChatThreadSidebar } from './admin-chat-thread-sidebar'
import { cn } from '@/lib/utils'

export function AdminBookingChatShell({
  rows,
  basePath,
  children,
}: {
  rows: AdminChatListRow[]
  basePath: string
  children: React.ReactNode
}) {
  const params = useParams()
  const isSelected = !!params.bookingId

  return (
    <div className="border-border bg-card flex min-h-[min(72vh,680px)] flex-1 overflow-hidden rounded-xl border">
      <div className={cn(
        "shrink-0 border-r border-border md:block md:w-[280px]",
        isSelected ? "hidden" : "w-full block"
      )}>
        <AdminChatThreadSidebar rows={rows} basePath={basePath} />
      </div>
      <div className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col",
        isSelected ? "flex" : "hidden md:flex"
      )}>
        {children}
      </div>
    </div>
  )
}
