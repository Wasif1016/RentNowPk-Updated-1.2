import { getRequiredUser } from '@/lib/auth/session'
import { getVendorProfileByUserId } from '@/lib/db/vendor-profile'
import { getVendorVerificationBannerMode } from '@/lib/vendor/verification-ui'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { UnreadBadgeRefreshOnFocus } from '@/components/dashboard/unread-badge-refresh-on-focus'
import { VENDOR_NAV } from '@/components/dashboard/dashboard-nav'
import { VendorVerificationBanner } from '@/components/vendor/vendor-verification-banner'
import { getCachedTotalUnreadForUser } from '@/lib/db/chat-unread-cached'

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const user = await getRequiredUser('VENDOR')
  const messagesUnread = await getCachedTotalUnreadForUser(user.id)
  const vendorProfile = await getVendorProfileByUserId(user.id)
  const bannerMode = vendorProfile
    ? getVendorVerificationBannerMode(vendorProfile)
    : 'hidden'

  const displayName = vendorProfile?.businessName?.trim() || user.fullName

  return (
    <DashboardShell
      navItems={VENDOR_NAV}
      sidebarUserName={displayName}
      navUnreadCounts={{
        '/vendor/chat': messagesUnread,
      }}
      user={{
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      }}
    >
      <UnreadBadgeRefreshOnFocus />
      <VendorVerificationBanner
        mode={bannerMode}
        statusNote={vendorProfile?.statusNote ?? null}
      />
      {children}
    </DashboardShell>
  )
}
