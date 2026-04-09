import { getRequiredUser } from '@/lib/auth/session'
import { BookingChatShell } from '@/components/chat/booking-chat-shell'
import { listBookingChatsForVendor } from '@/lib/db/chat'
import { ChatThreadSidebar } from '@/components/chat/chat-thread-sidebar'

export default async function VendorChatHubPage() {
  const user = await getRequiredUser('VENDOR')
  const rows = await listBookingChatsForVendor(user.id)

  return (
    <div className="flex flex-col h-full bg-[#f9f9ff] py-8">
      {/* Page Header - Tighter industrial style */}
      <header className="mb-8 px-4 md:px-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-0.5 w-8 bg-[#feae2c]" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0B1F3A]/40">Internal Comms</p>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-[#000615] font-['Space_Grotesk'] tracking-tighter uppercase leading-none">
          MESSAGES
        </h1>
      </header>

      {/* Main Container - On Mobile we show the list directly, on Desktop the Shell */}
      <div className="flex-1">
        {/* Desktop View: Shell with Sidebar + Placeholder */}
        <div className="hidden md:block">
          <BookingChatShell rows={rows} basePath="/vendor/chat">
            <div className="flex flex-1 flex-col items-center justify-center bg-[#f0f3ff] p-12 text-center">
              <div className="bg-white border-2 border-[#000615] p-10 mb-6 shadow-[12px_12px_0px_0px_#000]">
                 <span className="material-symbols-outlined text-7xl text-[#000615]">forum</span>
              </div>
              <h2 className="text-2xl font-black uppercase font-['Space_Grotesk'] text-[#000615] mb-2">Select a Thread</h2>
              <p className="text-[#44474d] font-medium max-w-sm">Choose a conversation from the sidebar to manage your bookings and customer inquiries.</p>
            </div>
          </BookingChatShell>
        </div>

        {/* Mobile View: Vertical list only */}
        <div className="md:hidden">
           <ChatThreadSidebar rows={rows} basePath="/vendor/chat" />
        </div>
      </div>
    </div>
  )
}
