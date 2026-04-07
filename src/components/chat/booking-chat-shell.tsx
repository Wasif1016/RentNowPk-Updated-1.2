import type { BookingListRow } from '@/lib/db/chat'
import { ChatThreadSidebar } from '@/components/chat/chat-thread-sidebar'

export function BookingChatShell({
  rows,
  basePath,
  children,
}: {
  rows: BookingListRow[]
  basePath: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[min(72vh,680px)] flex-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <ChatThreadSidebar rows={rows} basePath={basePath} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
