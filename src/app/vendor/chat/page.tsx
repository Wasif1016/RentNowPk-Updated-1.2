import { getRequiredUser } from '@/lib/auth/session'
import { BookingChatShell } from '@/components/chat/booking-chat-shell'
import { listBookingChatsForVendor } from '@/lib/db/chat'

export default async function VendorChatHubPage() {
  const user = await getRequiredUser('VENDOR')
  const rows = await listBookingChatsForVendor(user.id)

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="px-6 pt-6 pb-2 lg:px-8 bg-card/70 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Messages</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Secure conversations with customers</p>
          </div>
        </div>
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
