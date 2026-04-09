import Link from 'next/link'
import { format } from 'date-fns'
import { CalendarCheck, Clock, CheckCircle, AlertCircle, Search, ArrowRight, BookOpen } from 'lucide-react'
import { getRequiredUser } from '@/lib/auth/session'
import { getVendorBookingStats, getVendorBookingsList } from '@/lib/db/vendor-bookings'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card'
import { DashboardStatusBadge } from '@/components/dashboard/dashboard-status-badge'

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'] as const
const PAGE_SIZE = 20

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'CONFIRMED', label: 'Active' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'COMPLETED', label: 'Done' },
  { key: 'CANCELLED', label: 'X' },
] as const

export default async function VendorBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const user = await getRequiredUser('VENDOR')
  const params = await searchParams

  const statusFilter = VALID_STATUSES.includes(params.status as typeof VALID_STATUSES[number])
    ? params.status
    : ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  const [stats, { rows, total }] = await Promise.all([
    getVendorBookingStats(user.id),
    getVendorBookingsList({
      vendorUserId: user.id,
      status: statusFilter || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="font-sans space-y-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Page Header - Tighter */}
      <header className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#000615] tracking-tighter uppercase mb-2 leading-none">Bookings</h1>
          <p className="text-xs text-[#000615]/60 font-bold uppercase tracking-tight">
            Manage your rental ledger and trip lifecycle.
          </p>
        </div>
      </header>

      {/* Stats Grid - Small Gap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard label="Pipeline" value={String(stats.total)} icon={BookOpen} subtitle={`${stats.active} active`} />
        <DashboardStatCard label="Confirmed" value={String(stats.active)} icon={CheckCircle} />
        <DashboardStatCard label="Alerts" value={String(stats.pending)} icon={AlertCircle} className={stats.pending > 0 ? "border-[#feae2c] shadow-[4px_4px_0px_0px_#feae2c]" : ""} />
        <DashboardStatCard label="History" value={String(stats.completed)} icon={CalendarCheck} />
      </div>

      {/* Filter Bar - Tighter */}
      <div className="overflow-x-auto pb-2 custom-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {FILTERS.map((f) => {
            const isActive = statusFilter === f.key
            return (
              <Link key={f.key} href={f.key ? `/vendor/bookings?status=${f.key}` : '/vendor/bookings'} scroll={false}>
                <div className={cn(
                  "px-6 py-2 text-[10px] font-black uppercase tracking-widest border-2 transition-all active:translate-y-0.5",
                  isActive 
                    ? "bg-[#000615] text-white border-[#000615] shadow-[2px_2px_0px_0px_#F5A623]" 
                    : "bg-white text-[#000615] border-[#000615] shadow-[2px_2px_0px_0px_#000] hover:translate-y-[-1px]"
                )}>
                  {f.label}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Main Ledger Card - Compact Table */}
      <div className="bg-white border-2 border-[#000615] shadow-[6px_6px_0px_0px_#000] overflow-hidden flex flex-col mb-12">
        <div className="p-4 border-b-2 border-[#000615] bg-[#f0f3ff] flex justify-between items-center">
            <h3 className="text-sm font-black uppercase leading-none">Activity Log</h3>
        </div>

        {rows.length === 0 ? (
          <div className="p-20 text-center bg-[#f9f9ff]">
            <p className="text-[10px] font-black uppercase text-[#000615]/20 tracking-widest">No entries found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y-2 divide-[#000615]/10">
              <thead className="bg-gray-50">
                <tr className="divide-x-2 divide-[#000615]/5">
                  <th className="px-5 py-4 text-left text-[9px] font-black text-[#000615]/40 uppercase tracking-widest leading-none">Vehicle</th>
                  <th className="px-5 py-4 text-left text-[9px] font-black text-[#000615]/40 uppercase tracking-widest leading-none">User</th>
                  <th className="px-5 py-4 text-left text-[9px] font-black text-[#000615]/40 uppercase tracking-widest leading-none">Schedule</th>
                  <th className="px-5 py-4 text-left text-[9px] font-black text-[#000615]/40 uppercase tracking-widest leading-none">Status</th>
                  <th className="px-5 py-4 text-right text-[9px] font-black text-[#000615]/40 uppercase tracking-widest leading-none">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#000615]/5 bg-white">
                {rows.map((b) => (
                  <tr key={b.bookingId} className="hover:bg-gray-50/50 transition-colors divide-x-2 divide-[#000615]/5">
                    <td className="px-5 py-5 whitespace-nowrap">
                      <div className="font-black text-[#000615] text-[11px] uppercase truncate max-w-[150px]">{b.vehicleName}</div>
                      <div className="text-[8px] font-bold text-[#000615]/20 uppercase tracking-widest mt-1 font-mono">#{b.bookingId.slice(-6).toUpperCase()}</div>
                    </td>
                    <td className="px-5 py-5 whitespace-nowrap">
                      <div className="text-[10px] font-black text-[#000615] uppercase">{b.customerName}</div>
                    </td>
                    <td className="px-5 py-5 whitespace-nowrap">
                      <div className="text-[10px] font-black text-[#000615] uppercase leading-none">
                        {format(b.pickupAt, 'MMM d')} - {format(b.dropoffAt, 'MMM d')}
                      </div>
                      <div className="text-[8px] font-bold text-[#000615]/40 uppercase tracking-widest mt-1 italic truncate max-w-[120px]">
                        {b.pickupAddress || 'Verified'}
                      </div>
                    </td>
                    <td className="px-5 py-5 whitespace-nowrap">
                      <DashboardStatusBadge status={b.status} className="h-6 px-2 text-[8px]" />
                    </td>
                    <td className="px-5 py-5 whitespace-nowrap text-right">
                      <Button asChild className="bg-[#feae2c] border-2 border-[#000615] text-[#000615] font-black uppercase text-[9px] h-8 px-5 rounded-none shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] active:shadow-none transition-all">
                        <Link href={`/vendor/chat/${b.bookingId}`}>Manage</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
