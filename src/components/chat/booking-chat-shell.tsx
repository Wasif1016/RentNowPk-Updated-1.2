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
    <div className="flex h-[calc(100vh-140px)] min-h-[500px] flex-1 overflow-hidden border-2 border-[#000615] bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {/* Sidebar - Desktop Only or Hidden on Mobile if child is active */}
      <div className="hidden md:flex shrink-0">
        <ChatThreadSidebar rows={rows} basePath={basePath} />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#f9f9ff]">
        {children}
      </div>
    </div>
  )
}
