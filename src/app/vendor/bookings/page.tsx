import Link from 'next/link'
import { format } from 'date-fns'
import { CalendarCheck, Clock, CheckCircle, AlertCircle, Search } from 'lucide-react'
import { getRequiredUser } from '@/lib/auth/session'
import { getVendorBookingStats, getVendorBookingsList } from '@/lib/db/vendor-bookings'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card'
import { DashboardStatusBadge } from '@/components/dashboard/dashboard-status-badge'

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'] as const
const PAGE_SIZE = 20

const FILTERS = [
  { key: '', label: 'All Bookings' },
  { key: 'CONFIRMED', label: 'Active' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
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
    <div className="px-6 pt-10 pb-16 lg:px-12">
      {/* ─── Branded Header ─── */}
      <div className="mb-12">
         <div className="flex items-center gap-3 mb-4">
            <div className="h-2 w-10 bg-[#F5A623]" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#0B1B3D]/40 leading-none mt-0.5">Inventory Operations</h2>
         </div>
         <h1 className="text-5xl font-black tracking-tighter text-[#0B1B3D] uppercase leading-none mb-4">
            Booking<span className="text-[#F5A623] italic">Ledger</span>
         </h1>
         <p className="text-[12px] font-bold text-[#0B1B3D]/50 uppercase tracking-tight max-w-2xl leading-relaxed">
            Monitor incoming requests, verify customer credentials, and maintain your rental schedule with precision.
         </p>
      </div>

      {/* ─── Metric Strip ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <DashboardStatCard
          label="Total Pipeline"
          value={String(stats.total)}
          subtitle={`${stats.active} Currently active`}
          icon={CalendarCheck}
        />
        <DashboardStatCard
          label="Confirmed"
          value={String(stats.active)}
          subtitle="Revenue generating"
          icon={Clock}
        />
        <DashboardStatCard
          label="Closed Out"
          value={String(stats.completed)}
          subtitle="Past history"
          icon={CheckCircle}
        />
        <DashboardStatCard
          label="Priority Alerts"
          value={String(stats.pending)}
          subtitle={stats.pending > 0 ? "Review Required" : "All current"}
          icon={AlertCircle}
          className={stats.pending > 0 ? "border-[#F5A623]" : ""}
        />
      </div>

      {/* ─── Data Controls ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="bg-[#0B1B3D] p-1 rounded-sm flex flex-wrap gap-1 shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
          {FILTERS.map((f) => {
            const isActive = statusFilter === f.key
            return (
              <Link
                key={f.key}
                href={f.key ? `/vendor/bookings?status=${f.key}` : '/vendor/bookings'}
                scroll={false}
              >
                <div className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm",
                  isActive 
                    ? "bg-[#F5A623] text-[#0B1B3D] shadow-sm" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}>
                  {f.label}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ─── Booking Ledger Grid ─── */}
      <div className="bg-white border-4 border-[#0B1B3D] rounded-sm shadow-[8px_8px_0_#0F1E32/5] overflow-hidden">
        {rows.length === 0 ? (
          <div className="px-6 py-24 text-center">
            <Search className="h-12 w-12 text-[#0B1B3D]/10 mx-auto mb-6" strokeWidth={1} />
            <p className="text-[#0B1B3D]/30 font-black uppercase tracking-[0.2em] text-xs italic">
              {statusFilter
                ? `Zero matches found for ${statusFilter.toLowerCase()} criteria.`
                : 'Your booking ledger is currently empty.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y-4 divide-[#0B1B3D]">
                <thead className="bg-[#0B1B3D]">
                  <tr>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-white uppercase tracking-[0.2em]">Vehicle / Reference</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-white uppercase tracking-[0.2em]">Customer</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-white uppercase tracking-[0.2em]">Logistics</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-white uppercase tracking-[0.2em]">Configuration</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-white uppercase tracking-[0.2em]">Status</th>
                    <th className="px-6 py-5 text-right text-[10px] font-black text-white uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-[#0B1B3D]/5">
                  {rows.map((b) => (
                    <tr key={b.bookingId} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="font-black text-[#0B1B3D] text-sm uppercase tracking-tighter group-hover:text-[#F5A623] transition-colors">
                          {b.vehicleName}
                        </div>
                        <div className="text-[10px] font-bold text-[#0B1B3D]/40 uppercase tracking-tight mt-1">
                          Ref: #{b.bookingId.slice(-6).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="text-sm font-black text-[#0B1B3D] uppercase tracking-tighter">{b.customerName}</div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="text-[11px] font-bold text-[#0B1B3D] uppercase tracking-tight leading-none mb-1.5">
                           {format(b.pickupAt, 'MMM d')} – {format(b.dropoffAt, 'MMM d, yyyy')}
                        </div>
                        <div className="text-[9px] font-bold text-[#0B1B3D]/40 uppercase tracking-tight truncate max-w-[180px]">
                           {b.pickupAddress || 'No Address Logged'}
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 bg-[#F5A623]/5 border border-[#F5A623]/20 px-2 py-1 rounded-sm">
                           <div className="h-1 w-1 bg-[#F5A623] rounded-full" />
                           <span className="text-[9px] font-black text-[#0B1B3D] uppercase tracking-widest">
                             {b.driveType === 'SELF_DRIVE' ? 'Self Drive' : 'Chauffeur'}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <DashboardStatusBadge status={b.status} />
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-right">
                        <Link
                          href={`/vendor/chat/${b.bookingId}`}
                          className="inline-flex items-center bg-[#0B1B3D] text-white px-5 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0_#F5A623] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                        >
                          {b.status === 'PENDING' ? 'Operations' : 'Console'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Branded Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-6 border-t-4 border-[#0B1B3D]/5 flex justify-between items-center bg-gray-50/30">
                <p className="text-[10px] font-bold text-[#0B1B3D]/40 uppercase tracking-widest leading-none">
                  Page <span className="text-[#0B1B3D]">{page}</span> of <span className="text-[#0B1B3D]">{totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className={cn(
                    "border-2 border-[#0B1B3D] rounded-sm text-[10px] font-black uppercase h-9 px-4 transition-all shadow-[2px_2px_0_#0F1E32]",
                    page <= 1 && "opacity-30 cursor-not-allowed"
                  )}>
                    {page > 1 ? (
                       <Link href={`/vendor/bookings?status=${statusFilter}&page=${page - 1}`} scroll={false}>Prev</Link>
                    ) : (
                       <span>Prev</span>
                    )}
                  </Button>
                  
                  <div className="flex gap-1 items-center px-1">
                     {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                        const pageNum = i + 1
                        return (
                           <Link key={pageNum} href={`/vendor/bookings?status=${statusFilter}&page=${pageNum}`} scroll={false}>
                              <div className={cn(
                                 "w-9 h-9 flex items-center justify-center text-[10px] font-black border-2 transition-all rounded-sm",
                                 pageNum === page ? "bg-[#F5A623] border-[#0B1B3D] text-[#0B1B3D] shadow-[2px_2px_0_#0B1B3D]" : "border-[#0B1B3D]/10 text-[#0B1B3D] hover:border-[#0B1B3D]"
                              )}>
                                 {pageNum}
                              </div>
                           </Link>
                        )
                     })}
                  </div>

                  <Button asChild variant="outline" className={cn(
                    "border-2 border-[#0B1B3D] rounded-sm text-[10px] font-black uppercase h-9 px-4 transition-all shadow-[2px_2px_0_#0F1E32]",
                    page >= totalPages && "opacity-30 cursor-not-allowed"
                  )}>
                    {page < totalPages ? (
                       <Link href={`/vendor/bookings?status=${statusFilter}&page=${page + 1}`} scroll={false}>Next</Link>
                    ) : (
                       <span>Next</span>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
