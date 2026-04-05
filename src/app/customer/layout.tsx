import { getRequiredUser } from '@/lib/auth/session'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { UnreadBadgeRefreshOnFocus } from '@/components/dashboard/unread-badge-refresh-on-focus'
import { CUSTOMER_NAV } from '@/components/dashboard/dashboard-nav'
import { getCachedTotalUnreadForUser } from '@/lib/db/chat-unread-cached'

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const user = await getRequiredUser('CUSTOMER')
  const messagesUnread = await getCachedTotalUnreadForUser(user.id)

  return (
    <DashboardShell
      navItems={CUSTOMER_NAV}
      sidebarUserName={user.fullName}
      navUnreadCounts={{ '/customer/chat': messagesUnread }}
      user={{
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      }}
    >
      <UnreadBadgeRefreshOnFocus />
      {children}
    </DashboardShell>
  )
}
