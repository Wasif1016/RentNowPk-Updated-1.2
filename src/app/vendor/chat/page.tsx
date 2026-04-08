import { getRequiredUser } from '@/lib/auth/session'
import { BookingChatShell } from '@/components/chat/booking-chat-shell'
import { listBookingChatsForVendor } from '@/lib/db/chat'

export default async function VendorChatHubPage() {
  const user = await getRequiredUser('VENDOR')
  const rows = await listBookingChatsForVendor(user.id)

  return (
    <div className="flex flex-col flex-1 bg-gray-50/10">
      {/* ─── Branded Header ─── */}
      <div className="px-6 pt-10 pb-8 lg:px-12 border-b-4 border-[#0B1B3D] bg-white relative">
         <div className="absolute -bottom-1 left-0 w-24 h-1.5 bg-[#F5A623]" />
         
         <div className="flex items-center gap-3 mb-2">
            <div className="h-2 w-10 bg-[#F5A623]" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#0B1B3D]/40 leading-none mt-0.5">Secure Comms</h2>
         </div>
         <h1 className="text-4xl font-black tracking-tighter text-[#0B1B3D] uppercase leading-none">
            Member<span className="text-[#F5A623] italic">Connect</span>
         </h1>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 mt-4 mx-4 lg:mx-6 mb-6">
        <BookingChatShell rows={rows} basePath="/vendor/chat">
          <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-sm">
            <p className="text-foreground font-medium">Select a conversation</p>
            <p>Choose a booking from the list to chat with the customer.</p>
          </div>
        </BookingChatShell>
      </div>
    </div>
  )
}
