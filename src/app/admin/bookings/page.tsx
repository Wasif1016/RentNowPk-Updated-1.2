import Link from 'next/link'
import { format } from 'date-fns'
import { CalendarCheck, Clock, CheckCircle, AlertCircle, Search } from 'lucide-react'
import { getRequiredUser } from '@/lib/auth/session'
import { getAdminBookingStats, getAdminBookingsList } from '@/lib/db/admin-bookings'
import { BookingStatusBadge } from '@/components/dashboard/booking-status-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'] as const
const PAGE_SIZE = 20

const FILTERS = [
  { key: '', label: 'All Bookings' },
  { key: 'CONFIRMED', label: 'Active' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
] as const

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  await getRequiredUser('ADMIN')
  const params = await searchParams

  const statusFilter = VALID_STATUSES.includes(params.status as typeof VALID_STATUSES[number])
    ? params.status
    : ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  const [stats, { rows, total }] = await Promise.all([
    getAdminBookingStats(),
    getAdminBookingsList({
      status: statusFilter || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="px-6 pt-8 pb-10 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Bookings</h1>
          <p className="text-muted-foreground mt-1">
            Platform-wide booking overview and moderation.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Bookings"
          value={String(stats.total)}
          subtitle={`${stats.pending} pending`}
          icon={CalendarCheck}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Active Bookings"
          value={String(stats.active)}
          subtitle="Currently in progress"
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Completed"
          value={String(stats.completed)}
          subtitle="Successfully finished"
          icon={CheckCircle}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          label="Pending"
          value={String(stats.pending)}
          subtitle={stats.pending > 0 ? 'Awaiting vendor response' : 'All clear'}
          icon={AlertCircle}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => {
          const isActive = statusFilter === f.key
          return (
            <Link
              key={f.key}
              href={f.key ? `/admin/bookings?status=${f.key}` : '/admin/bookings'}
              scroll={false}
            >
              <Badge
                variant={isActive ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                )}
              >
                {f.label}
              </Badge>
            </Link>
          )
        })}
      </div>

      {/* Bookings Table */}
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {statusFilter
                ? `No ${statusFilter.toLowerCase()} bookings found.`
                : 'No bookings on the platform yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Car
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {rows.map((b) => (
                    <tr key={b.bookingId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground text-sm">
                          {b.vehicleName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{b.customerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{b.vendorBusinessName || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {format(b.pickupAt, 'MMM d')} – {format(b.dropoffAt, 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <BookingStatusBadge status={b.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/admin/chat/${b.bookingId}`}
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          View Chat
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex justify-between items-center flex-wrap gap-3">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} bookings
                </p>
                <div className="flex gap-1">
                  {page > 1 && (
                    <Link
                      href={`/admin/bookings?status=${statusFilter}&page=${page - 1}`}
                      scroll={false}
                    >
                      <Button variant="outline" size="sm" className="rounded-lg text-sm">
                        Previous
                      </Button>
                    </Link>
                  )}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    return (
                      <Link
                        key={pageNum}
                        href={`/admin/bookings?status=${statusFilter}&page=${pageNum}`}
                        scroll={false}
                      >
                        <Button
                          variant={pageNum === page ? 'default' : 'outline'}
                          size="sm"
                          className="rounded-lg text-sm min-w-[2.25rem]"
                        >
                          {pageNum}
                        </Button>
                      </Link>
                    )
                  })}
                  {page < totalPages && (
                    <Link
                      href={`/admin/bookings?status=${statusFilter}&page=${page + 1}`}
                      scroll={false}
                    >
                      <Button variant="outline" size="sm" className="rounded-lg text-sm">
                        Next
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
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
