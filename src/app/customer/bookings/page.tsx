import Link from 'next/link'
import { format } from 'date-fns'
import { CalendarCheck, Clock, CheckCircle, AlertCircle, Search } from 'lucide-react'
import { getRequiredUser } from '@/lib/auth/session'
import { getCustomerBookingStats, getCustomerBookingsList } from '@/lib/db/customer-bookings'
import { DashboardStatusBadge } from '@/components/dashboard/dashboard-status-badge'
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card'
import { Button } from '@/components/ui/button'
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

export default async function CustomerBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const user = await getRequiredUser('CUSTOMER')
  const params = await searchParams

  const statusFilter = VALID_STATUSES.includes(params.status as typeof VALID_STATUSES[number])
    ? params.status
    : ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  const [stats, { rows, total }] = await Promise.all([
    getCustomerBookingStats(user.id),
    getCustomerBookingsList({
      customerUserId: user.id,
      status: statusFilter || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="px-6 pt-10 pb-20 lg:px-10 max-w-[1400px] mx-auto">
      {/* ─── Premium Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 px-2">
         <div>
            <div className="flex items-center gap-3 mb-3">
               <div className="h-1 w-8 bg-[#F5A623] rounded-full" />
               <h2 className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#0B1B3D]/30 leading-none">History Log</h2>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0B1B3D] leading-none mb-4">
               My<span className="text-[#F5A623] italic">Journeys</span>
            </h1>
            <p className="text-sm font-medium text-[#0B1B3D]/50 max-w-xl leading-relaxed">
               Track your rental requests, active trips, and communicate directly with vendors in the cloud.
            </p>
         </div>

         <Button asChild className="bg-[#0B1B3D] text-white rounded-2xl h-11 px-8 font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#0B1B3D]/20 hover:bg-[#F5A623] hover:text-[#0B1B3D] transition-all shrink-0">
           <Link href="/search">
              <Search className="h-4 w-4 mr-2 text-[#F5A623]" strokeWidth={2.5} />
              Book New Vehicle
           </Link>
         </Button>
      </div>

      {/* ─── Summary Metrics ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <DashboardStatCard
          label="Total Trips"
          value={String(stats.total)}
          subtitle={`${stats.completed} Finished`}
          icon={CalendarCheck}
        />
        <DashboardStatCard
          label="Active Now"
          value={String(stats.active)}
          subtitle={stats.active > 0 ? 'On the road' : 'All returned'}
          icon={Clock}
          className={stats.active > 0 ? "border-[#F5A623]/20 bg-[#F5A623]/[0.02]" : ""}
        />
        <DashboardStatCard
          label="Historical"
          value={String(stats.completed)}
          subtitle="Past journeys"
          icon={CheckCircle}
        />
        <DashboardStatCard
          label="Pending"
          value={String(stats.pending)}
          subtitle={stats.pending > 0 ? 'Awaiting reply' : 'All response'}
          icon={AlertCircle}
        />
      </div>

      {/* ─── Filter Navigation ─── */}
      <div className="flex flex-wrap items-center gap-2 mb-8 px-2">
        <div className="bg-white border border-gray-100 p-1.5 rounded-2xl flex flex-wrap gap-1 shadow-sm">
          {FILTERS.map((f) => {
            const isActive = statusFilter === f.key
            return (
              <Link
                key={f.key}
                href={f.key ? `/customer/bookings?status=${f.key}` : '/customer/bookings'}
                scroll={false}
              >
                <div className={cn(
                  "px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-[14px]",
                  isActive 
                    ? "bg-[#0B1B3D] text-white shadow-lg shadow-[#0B1B3D]/20 animate-in fade-in zoom-in duration-300" 
                    : "text-[#0B1B3D]/30 hover:text-[#0B1B3D] hover:bg-gray-50"
                )}>
                  {f.label}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ─── Ledger Card ─── */}
      <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
        {rows.length === 0 ? (
          <div className="p-32 text-center">
            <Search className="h-16 w-16 text-[#0B1B3D]/10 mx-auto mb-6" strokeWidth={1} />
            <p className="text-[#0B1B3D]/20 font-bold uppercase tracking-widest text-xs italic leading-relaxed">
              {statusFilter
                ? `Zero results found for your ${statusFilter.toLowerCase()} filter.`
                : 'Your booking history is currently empty.'}
            </p>
            {!statusFilter && (
              <Button asChild variant="ghost" className="mt-8 text-[#0B1B3D] font-bold text-xs uppercase tracking-widest hover:bg-gray-50 rounded-xl px-10 h-11 border border-gray-100">
                <Link href="/search">Browse Vehicles</Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-50">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-8 py-5 text-left text-[10px] font-extrabold text-[#0B1B3D]/30 uppercase tracking-[0.2em]">Vehicle / Dates</th>
                    <th className="px-8 py-5 text-left text-[10px] font-extrabold text-[#0B1B3D]/30 uppercase tracking-[0.2em]">Provider</th>
                    <th className="px-8 py-5 text-left text-[10px] font-extrabold text-[#0B1B3D]/30 uppercase tracking-[0.2em]">Pickup Point</th>
                    <th className="px-8 py-5 text-left text-[10px] font-extrabold text-[#0B1B3D]/30 uppercase tracking-[0.2em]">Configuration</th>
                    <th className="px-8 py-5 text-left text-[10px] font-extrabold text-[#0B1B3D]/30 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5 text-right text-[10px] font-extrabold text-[#0B1B3D]/30 uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((b) => (
                    <tr key={b.bookingId} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-7 whitespace-nowrap">
                        <div className="font-extrabold text-[#0B1B3D] text-[13px] uppercase tracking-tight group-hover:text-[#F5A623] transition-colors leading-none mb-2">
                          {b.vehicleName}
                        </div>
                        <div className="text-[10px] font-bold text-[#0B1B3D]/20 uppercase tracking-[0.1em]">
                           {format(b.pickupAt, 'MMM d')} <span className="text-gray-200 mx-1">—</span> {format(b.dropoffAt, 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="px-8 py-7 whitespace-nowrap">
                        <div className="text-sm font-bold text-[#0B1B3D]">{b.vendorBusinessName || 'Direct Vendor'}</div>
                      </td>
                      <td className="px-8 py-7 whitespace-nowrap">
                        <div className="text-[11px] font-medium text-[#0B1B3D]/40 uppercase tracking-tight truncate max-w-[200px] italic">
                          {b.pickupAddress || 'Address on file'}
                        </div>
                      </td>
                      <td className="px-8 py-7 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
                           <div className="h-1.5 w-1.5 bg-[#F5A623] rounded-full" />
                           <span className="text-[9px] font-bold text-[#0B1B3D]/60 uppercase tracking-widest mt-0.5">
                             {b.driveType === 'SELF_DRIVE' ? 'Self Drive' : 'With Driver'}
                           </span>
                        </div>
                      </td>
                      <td className="px-8 py-7 whitespace-nowrap">
                        <DashboardStatusBadge status={b.status} />
                      </td>
                      <td className="px-8 py-7 whitespace-nowrap text-right">
                        <Link
                          href={`/customer/chat/${b.bookingId}`}
                          className="inline-flex items-center bg-white border border-[#0B1B3D]/10 text-[#0B1B3D] px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-[#0B1B3D] hover:text-white transition-all active:scale-95"
                        >
                          Open Chat
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-8 py-8 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-6 bg-gray-50/20">
                <p className="text-[10px] font-bold text-[#0B1B3D]/30 uppercase tracking-[0.2em] leading-none">
                  Page <span className="text-[#0B1B3D] font-black">{page}</span> of <span className="text-[#0B1B3D] font-black">{totalPages}</span>
                </p>
                <div className="flex gap-4 items-center">
                  <Button asChild variant="ghost" className={cn(
                    "text-[#0B1B3D]/40 font-bold text-[10px] uppercase tracking-[0.2em] h-auto p-0 hover:text-[#0B1B3D] hover:bg-transparent transition-all",
                    page <= 1 && "opacity-0 pointer-events-none"
                  )}>
                    {page > 1 ? (
                       <Link href={`/customer/bookings?status=${statusFilter}&page=${page - 1}`} scroll={false} className="flex items-center gap-2 group">
                          <div className="h-[2px] w-4 bg-gray-200 group-hover:w-8 group-hover:bg-[#F5A623] transition-all" />
                          Back
                       </Link>
                    ) : (
                       <span>Back</span>
                    )}
                  </Button>
                  
                  <div className="flex gap-2">
                     {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pageNum = i + 1
                        return (
                           <Link key={pageNum} href={`/customer/bookings?status=${statusFilter}&page=${pageNum}`} scroll={false}>
                              <div className={cn(
                                 "w-9 h-9 flex items-center justify-center text-[10px] font-extrabold rounded-xl transition-all border",
                                 pageNum === page ? "bg-[#0B1B3D] border-[#0B1B3D] text-white shadow-lg shadow-[#0B1B3D]/20" : "border-gray-100 text-[#0B1B3D]/40 hover:border-[#F5A623] hover:text-[#0B1B3D]"
                              )}>
                                 {pageNum}
                              </div>
                           </Link>
                        )
                     })}
                  </div>

                  <Button asChild variant="ghost" className={cn(
                    "text-[#0B1B3D]/40 font-bold text-[10px] uppercase tracking-[0.2em] h-auto p-0 hover:text-[#0B1B3D] hover:bg-transparent transition-all",
                    page >= totalPages && "opacity-0 pointer-events-none"
                  )}>
                    {page < totalPages ? (
                       <Link href={`/customer/bookings?status=${statusFilter}&page=${page + 1}`} scroll={false} className="flex items-center gap-2 group">
                          Next
                          <div className="h-[2px] w-4 bg-gray-200 group-hover:w-8 group-hover:bg-[#F5A623] transition-all" />
                       </Link>
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
