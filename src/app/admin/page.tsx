import Link from 'next/link'
import { Users, CarFront, Clock, CalendarCheck, UserCheck, AlertCircle } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { getAdminDashboardStats, getAdminPendingVendors, getAdminRecentBookings } from '@/lib/db/admin-dashboard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    CONFIRMED: { label: 'Active', cls: 'bg-green-50 text-green-700 border-green-200' },
    COMPLETED: { label: 'Completed', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    REJECTED: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200' },
    CANCELLED: { label: 'Cancelled', cls: 'bg-gray-50 text-gray-600 border-gray-200' },
    PENDING_VERIFICATION: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    APPROVED: { label: 'Approved', cls: 'bg-green-50 text-green-700 border-green-200' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-gray-50 text-gray-600 border-gray-200' }
  return (
    <Badge variant="secondary" className={`border ${s.cls} font-medium`}>
      {s.label}
    </Badge>
  )
}

export default async function AdminDashboardPage() {
  const [stats, pendingVendors, recentBookings] = await Promise.all([
    getAdminDashboardStats(),
    getAdminPendingVendors(5),
    getAdminRecentBookings(5),
  ])

  return (
    <div className="px-6 pt-8 pb-10 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview and moderation queue.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Users"
          value={String(stats.totalUsers)}
          subtitle={`${stats.totalVendors} vendors`}
          icon={Users}
          iconBg="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          label="Pending Verifications"
          value={String(stats.pendingVerifications)}
          subtitle={stats.pendingVerifications > 0 ? 'Needs review' : 'All clear'}
          icon={UserCheck}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Active Bookings"
          value={String(stats.activeBookings)}
          subtitle={`${stats.totalBookings} total`}
          icon={CalendarCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Total Vehicles"
          value={String(stats.totalVehicles)}
          subtitle="Listed across all vendors"
          icon={CarFront}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
      </div>

      {/* Pending Vendors + Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 rounded-xl bg-card border border-border shadow-sm">
          <div className="px-6 py-5 border-b border-border">
            <h3 className="font-semibold text-foreground">Recent Bookings</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Latest booking activity across the platform</p>
          </div>
          {recentBookings.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-muted-foreground text-sm">No bookings yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentBookings.map((b) => (
                <div key={b.bookingId} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{b.vehicleName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {b.customerName} &middot; {b.vendorBusinessName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {formatDistanceToNow(b.createdAt, { addSuffix: true })}
                    </span>
                    {statusBadge(b.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Vendors */}
        <div className="rounded-xl bg-card border border-border shadow-sm p-5">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            Vendor Verification Queue
          </h3>
          {pendingVendors.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-4">No pending verifications.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {pendingVendors.map((v) => (
                <div key={v.vendorId} className="flex justify-between items-start border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{v.businessName || v.publicSlug}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {v.submittedAt ? formatDistanceToNow(v.submittedAt, { addSuffix: true }) : 'No date'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {statusBadge(v.status)}
                    <Link
                      href="/admin/vendors"
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button asChild variant="outline" size="sm" className="w-full mt-5 text-sm rounded-lg">
            <Link href="/admin/vendors">View all vendors &rarr;</Link>
          </Button>
        </div>
      </div>

      {/* Admin Tip */}
      <div className="rounded-2xl bg-accent/50 border border-accent p-5 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Quick moderation tip</h4>
            <p className="text-sm text-muted-foreground">Review vendor verifications promptly to keep the marketplace healthy.</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full text-sm font-medium">
          <Link href="/admin/vendors">Review vendors &rarr;</Link>
        </Button>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string
  value: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="rounded-xl bg-card border border-border shadow-sm p-5 transition-shadow hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{value}</p>
          <span className="text-xs text-muted-foreground mt-2 inline-block">{subtitle}</span>
        </div>
        <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
