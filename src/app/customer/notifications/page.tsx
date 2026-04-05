import { getRequiredUser } from '@/lib/auth/session'
import { listNotificationsForUser } from '@/lib/actions/notifications'
import { NotificationsList } from '@/components/notifications/notifications-list'

export default async function CustomerNotificationsPage() {
  await getRequiredUser('CUSTOMER')
  const notifications = await listNotificationsForUser()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          Notifications
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Stay updated on your bookings and messages.
        </p>
      </div>

      <NotificationsList notifications={notifications} />
    </div>
  )
}
