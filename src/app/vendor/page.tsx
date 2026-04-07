import Link from 'next/link'
import { Wallet, CalendarCheck, CarFront, CheckCircle, Clock } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { getVendorProfileByUserId } from '@/lib/db/vendor-profile'
import {
  getVendorDashboardStats,
  getVendorUpcomingPickups,
  getVendorRecentBookings,
} from '@/lib/db/vendor-dashboard'
import { getRequiredUser } from '@/lib/auth/session'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function statusBadge(status: string) {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string; cls: string }> = {
    PENDING: { variant: 'secondary', label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    CONFIRMED: { variant: 'default', label: 'Active', cls: 'bg-green-50 text-green-700 border-green-200' },
    COMPLETED: { variant: 'secondary', label: 'Completed', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    REJECTED: { variant: 'destructive', label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200' },
    CANCELLED: { variant: 'secondary', label: 'Cancelled', cls: 'bg-gray-50 text-gray-600 border-gray-200' },
  }
  const s = map[status] ?? { variant: 'secondary' as const, label: status, cls: 'bg-gray-50 text-gray-600 border-gray-200' }
  return (
    <Badge variant={s.variant} className={`border ${s.cls} font-medium`}>
      {s.label}
    </Badge>
  )
}

export default async function VendorDashboardPage() {
  const user = await getRequiredUser('VENDOR')
  const vendorProfile = await getVendorProfileByUserId(user.id)

  if (!vendorProfile) {
    return (
      <div className="px-6 pt-8 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Vendor profile not found. Please contact support.</p>
      </div>
    )
  }

  const [stats, upcoming, recent] = await Promise.all([
    getVendorDashboardStats(vendorProfile.id),
    getVendorUpcomingPickups(vendorProfile.id, 3),
    getVendorRecentBookings(vendorProfile.id, 5),
  ])

  return (
    <div className="px-6 pt-8 pb-10 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user.fullName.split(' ')[0]}. Here&apos;s what&apos;s happening with your rentals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="rounded-xl text-sm font-medium">
            <Link href="/vendor/vehicles">
              <CarFront className="h-4 w-4 mr-1.5" />
              Manage Fleet
            </Link>
          </Button>
          <Button asChild size="sm" className="rounded-xl text-sm font-semibold">
            <Link href="/vendor/vehicles/add">Add New Car</Link>
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Bookings"
          value={String(stats.totalBookings)}
          subtitle={`${stats.confirmedBookings} active now`}
          icon={CalendarCheck}
          iconBg="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          label="Pending Requests"
          value={String(stats.pendingBookings)}
          subtitle={stats.pendingBookings > 0 ? 'Needs your attention' : 'All caught up'}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Total Cars Listed"
          value={String(stats.totalVehicles)}
          subtitle={`${stats.activeVehicles} available now`}
          icon={CarFront}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatCard
          label="Completion Rate"
          value={`${stats.completionRate}%`}
          subtitle={stats.completionRate >= 90 ? 'Excellent' : stats.completionRate >= 70 ? 'Good' : 'Needs improvement'}
          icon={CheckCircle}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Upcoming Pickups + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Upcoming Pickups */}
        <div className="lg:col-span-2 rounded-xl bg-card border border-border shadow-sm">
          <div className="px-6 py-5 border-b border-border">
            <h3 className="font-semibold text-foreground">Recent Bookings</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Manage and track your incoming rental requests</p>
          </div>
          {recent.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-muted-foreground text-sm">No bookings yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((b) => (
                <div key={b.bookingId} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{b.vehicleName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {b.customerName} &middot; {format(b.pickupAt, 'MMM d')} – {format(b.dropoffAt, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {statusBadge(b.status)}
                    <Link
                      href={`/vendor/chat/${b.bookingId}`}
                      className="text-primary text-sm font-medium hover:underline shrink-0"
                    >
                      Chat
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-6 py-4 border-t border-border">
            <Link href="/vendor/bookings" className="text-primary text-sm font-medium hover:underline">
              View all bookings &rarr;
            </Link>
          </div>
        </div>

        {/* Upcoming Pickups Sidebar */}
        <div className="rounded-xl bg-card border border-border shadow-sm p-5">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Upcoming Pickups
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-4">No upcoming pickups.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {upcoming.map((p) => (
                <div key={p.bookingId} className="flex justify-between items-start border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{p.vehicleName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatDistanceToNow(p.pickupAt, { addSuffix: true })} &middot; {p.customerName}
                    </p>
                  </div>
                  {statusBadge(p.status)}
                </div>
              ))}
            </div>
          )}
          <Button asChild variant="outline" size="sm" className="w-full mt-5 text-sm rounded-lg">
            <Link href="/vendor/bookings">View all bookings &rarr;</Link>
          </Button>
        </div>
      </div>

      {/* Vendor Tip */}
      <div className="rounded-2xl bg-accent/50 border border-accent p-5 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Vendor tip: respond within 1 hour</h4>
            <p className="text-sm text-muted-foreground">Fast replies increase your booking conversion by 40%.</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full text-sm font-medium">
          <Link href="/vendor/profile">View best practices &rarr;</Link>
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
