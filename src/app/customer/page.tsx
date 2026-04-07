import Link from 'next/link'
import { CalendarCheck, Clock, CheckCircle, Search, CarFront } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { getRequiredUser } from '@/lib/auth/session'
import {
  getCustomerDashboardStats,
  getCustomerRecentBookings,
  getCustomerUpcomingBookings,
} from '@/lib/db/customer-dashboard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    CONFIRMED: { label: 'Active', cls: 'bg-green-50 text-green-700 border-green-200' },
    COMPLETED: { label: 'Completed', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    REJECTED: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200' },
    CANCELLED: { label: 'Cancelled', cls: 'bg-gray-50 text-gray-600 border-gray-200' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-gray-50 text-gray-600 border-gray-200' }
  return (
    <Badge variant="secondary" className={`border ${s.cls} font-medium`}>
      {s.label}
    </Badge>
  )
}

export default async function CustomerDashboardPage() {
  const user = await getRequiredUser('CUSTOMER')

  const [stats, upcoming, recent] = await Promise.all([
    getCustomerDashboardStats(user.id),
    getCustomerUpcomingBookings(user.id, 3),
    getCustomerRecentBookings(user.id, 5),
  ])

  return (
    <div className="px-6 pt-8 pb-10 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user.fullName.split(' ')[0]}. Here&apos;s your rental activity.
          </p>
        </div>
        <Button asChild size="sm" className="rounded-xl text-sm font-semibold">
          <Link href="/search">
            <Search className="h-4 w-4 mr-1.5" />
            Find a Car
          </Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Bookings"
          value={String(stats.totalBookings)}
          subtitle={`${stats.completedBookings} completed`}
          icon={CalendarCheck}
          iconBg="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          label="Active Bookings"
          value={String(stats.activeBookings)}
          subtitle={stats.activeBookings > 0 ? 'Currently renting' : 'No active rentals'}
          icon={CarFront}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Pending Requests"
          value={String(stats.pendingBookings)}
          subtitle={stats.pendingBookings > 0 ? 'Awaiting vendor response' : 'All caught up'}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Completed Trips"
          value={String(stats.completedBookings)}
          subtitle={stats.completedBookings > 0 ? 'Great history' : 'Book your first ride'}
          icon={CheckCircle}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
      </div>

      {/* Upcoming + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 rounded-xl bg-card border border-border shadow-sm">
          <div className="px-6 py-5 border-b border-border">
            <h3 className="font-semibold text-foreground">Recent Bookings</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Your rental history and current trips</p>
          </div>
          {recent.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-muted-foreground text-sm">No bookings yet.</p>
              <Button asChild variant="outline" size="sm" className="mt-3 rounded-full">
                <Link href="/search">Browse vehicles</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((b) => (
                <div key={b.bookingId} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{b.vehicleName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {b.vendorBusinessName} &middot; {format(b.pickupAt, 'MMM d')} – {format(b.dropoffAt, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {statusBadge(b.status)}
                    <Link
                      href={`/customer/chat/${b.bookingId}`}
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
            <Link href="/customer/bookings" className="text-primary text-sm font-medium hover:underline">
              View all bookings &rarr;
            </Link>
          </div>
        </div>

        {/* Upcoming Sidebar */}
        <div className="rounded-xl bg-card border border-border shadow-sm p-5">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Upcoming Trips
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-4">No upcoming trips.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {upcoming.map((b) => (
                <div key={b.bookingId} className="flex justify-between items-start border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{b.vehicleName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatDistanceToNow(b.pickupAt, { addSuffix: true })}
                    </p>
                  </div>
                  {statusBadge(b.status)}
                </div>
              ))}
            </div>
          )}
          <Button asChild variant="outline" size="sm" className="w-full mt-5 text-sm rounded-lg">
            <Link href="/customer/bookings">View all bookings &rarr;</Link>
          </Button>
        </div>
      </div>

      {/* Tip */}
      <div className="rounded-2xl bg-accent/50 border border-accent p-5 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Tip: Book in advance</h4>
            <p className="text-sm text-muted-foreground">Vehicles get booked quickly during holidays and weekends.</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full text-sm font-medium">
          <Link href="/search">Find a car &rarr;</Link>
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
