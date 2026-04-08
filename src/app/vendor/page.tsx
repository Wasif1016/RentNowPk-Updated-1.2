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
import { cn } from '@/lib/utils'


import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card'
import { DashboardStatusBadge } from '@/components/dashboard/dashboard-status-badge'

export default async function VendorDashboardPage() {
  const user = await getRequiredUser('VENDOR')
  const vendorProfile = await getVendorProfileByUserId(user.id)

  if (!vendorProfile) {
    return (
      <div className="px-6 pt-12 lg:px-8">
        <h1 className="text-4xl font-black text-[#0B1B3D] uppercase tracking-tighter mb-4">Access Denied</h1>
        <p className="text-[#0B1B3D]/60 font-medium italic">Vendor profile not found. Please contact support.</p>
      </div>
    )
  }

  const [stats, upcoming, recent] = await Promise.all([
    getVendorDashboardStats(vendorProfile.id),
    getVendorUpcomingPickups(vendorProfile.id, 3),
    getVendorRecentBookings(vendorProfile.id, 5),
  ])

  return (
    <div className="px-6 pt-10 pb-16 lg:px-12">
      {/* ─── Premium Header ─── */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-12 border-b-4 border-[#0B1B3D] pb-10 relative">
         <div className="absolute -bottom-1 left-0 w-24 h-1.5 bg-[#F5A623]" />
         
         <div>
            <div className="flex items-center gap-3 mb-4">
               <div className="h-2 w-10 bg-[#F5A623]" />
               <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#0B1B3D]/40 leading-none mt-0.5">Performance Overview</h2>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-[#0B1B3D] uppercase leading-none">
               Vendor<span className="text-[#F5A623] italic">Console</span>
            </h1>
            <p className="text-[12px] font-bold text-[#0B1B3D]/50 uppercase tracking-tight mt-4 max-w-xl leading-relaxed">
               Welcome back, <span className="text-[#0B1B3D]">{user.fullName.split(' ')[0]}</span>. You have <span className="text-[#F5A623] underline decoration-2 underline-offset-4">{stats.pendingBookings} pending requests</span> that need your immediate attention.
            </p>
         </div>

         <div className="flex items-center gap-4">
            <Button asChild variant="outline" className="border-2 border-[#0B1B3D] rounded-sm text-[11px] font-black uppercase tracking-widest text-[#0B1B3D] shadow-[4px_4px_0_#0F1E32] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all h-12 px-6">
              <Link href="/vendor/vehicles">
                <CarFront className="h-4 w-4 mr-2 text-[#F5A623]" />
                Fleet Manager
              </Link>
            </Button>
            <Button asChild className="bg-[#0B1B3D] text-white border-2 border-[#0B1B3D] rounded-sm text-[11px] font-black uppercase tracking-widest shadow-[4px_4px_0_#F5A623] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all h-12 px-8">
              <Link href="/vendor/vehicles/add">List New Vehicle</Link>
            </Button>
         </div>
      </div>

      {/* ─── Key Metrics ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <DashboardStatCard
          label="Total Bookings"
          value={String(stats.totalBookings)}
          subtitle={`${stats.confirmedBookings} Active rentals`}
          icon={CalendarCheck}
        />
        <DashboardStatCard
          label="Pending Review"
          value={String(stats.pendingBookings)}
          subtitle={stats.pendingBookings > 0 ? 'Action required' : 'All clear'}
          icon={Clock}
          className={stats.pendingBookings > 0 ? "border-[#F5A623]" : ""}
        />
        <DashboardStatCard
          label="Total Fleet"
          value={String(stats.totalVehicles)}
          subtitle={`${stats.activeVehicles} Online now`}
          icon={CarFront}
        />
        <DashboardStatCard
          label="Reliability"
          value={`${stats.completionRate}%`}
          subtitle={stats.completionRate >= 90 ? 'Power Vendor' : 'Standard'}
          icon={CheckCircle}
        />
      </div>

      {/* ─── Activity Dashboard ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        {/* Recent Activity Table */}
        <div className="xl:col-span-2 bg-white border-4 border-[#0B1B3D] rounded-sm shadow-[8px_8px_0_#0B1B3D/5] overflow-hidden">
          <div className="bg-[#0B1B3D] px-6 py-5 flex items-center justify-between">
            <div>
               <h3 className="text-xs font-black text-white uppercase tracking-widest mb-1">Recent Booking Requests</h3>
               <p className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">Your latest incoming rental pipeline</p>
            </div>
            <Link href="/vendor/bookings" className="text-[10px] font-black uppercase text-[#F5A623] underline underline-offset-4 decoration-2">Entire History</Link>
          </div>
          
          {recent.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-[#0B1B3D]/30 font-black uppercase tracking-widest text-xs italic">No activity detected yet.</p>
            </div>
          ) : (
            <div className="divide-y-2 divide-[#0B1B3D]/5">
              {recent.map((b) => (
                <div key={b.bookingId} className="px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 bg-[#F5A623]/10 border-2 border-[#0B1B3D] rounded-sm flex items-center justify-center shrink-0 shadow-[2px_2px_0_#0B1B3D]">
                       <CarFront className="h-6 w-6 text-[#0B1B3D]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-[#0B1B3D] uppercase text-sm tracking-tighter leading-none mb-1 group-hover:text-[#F5A623] transition-colors">{b.vehicleName}</p>
                      <p className="text-[10px] font-bold text-[#0B1B3D]/40 uppercase tracking-tight">
                        {b.customerName} &middot; {format(b.pickupAt, 'MMM d')} – {format(b.dropoffAt, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <DashboardStatusBadge status={b.status} />
                    <Link
                      href={`/vendor/chat/${b.bookingId}`}
                      className="bg-[#0B1B3D] text-white px-5 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0_#F5A623] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                      Connect
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Upcoming Alerts */}
        <aside className="space-y-8">
           <div className="bg-white border-4 border-[#0B1B3D] p-6 rounded-sm shadow-[8px_8px_0_#F5A623/20]">
              <div className="flex items-center gap-3 mb-6">
                 <Clock className="h-5 w-5 text-[#F5A623]" strokeWidth={3} />
                 <h3 className="text-xs font-black text-[#0B1B3D] uppercase tracking-widest leading-none mt-1">Upcoming Logistics</h3>
              </div>
              
              {upcoming.length === 0 ? (
                <p className="text-[10px] font-bold text-[#0B1B3D]/30 uppercase italic">No immediate pickups scheduled.</p>
              ) : (
                <div className="space-y-6">
                  {upcoming.map((p) => (
                    <div key={p.bookingId} className="flex flex-col gap-2 border-b-2 border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-black text-[#0B1B3D] text-[12px] uppercase tracking-tighter truncate leading-tight">{p.vehicleName}</p>
                        <DashboardStatusBadge status={p.status} className="scale-75 origin-right translate-x-1" />
                      </div>
                      <p className="text-[10px] font-bold text-[#0B1B3D]/50 uppercase tracking-tight leading-none mb-1">
                        {formatDistanceToNow(p.pickupAt, { addSuffix: true })} &middot; {p.customerName}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              
              <Button asChild variant="outline" className="w-full mt-6 border-2 border-[#0B1B3D] rounded-sm text-[9px] font-black uppercase tracking-[0.2em] shadow-[3px_3px_0_#0F1E32]">
                <Link href="/vendor/bookings">Detailed Schedule</Link>
              </Button>
           </div>

           {/* Branded Tip Card */}
           <div className="bg-[#0B1B3D] p-6 rounded-sm text-white border-2 border-[#0B1B3D] shadow-[8px_8px_0_#F5A623]">
             <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 bg-[#F5A623] border-2 border-white rounded-sm flex items-center justify-center rotate-3 shadow-lg">
                   <Wallet className="h-5 w-5 text-[#0B1B3D]" />
                </div>
                <h4 className="text-[11px] font-black uppercase text-[#F5A623] tracking-widest leading-tight italic">Revenue Optimization</h4>
             </div>
             <p className="text-[10px] font-bold text-white/70 leading-relaxed uppercase tracking-tight">
                Responsive vendors who reply within <span className="text-[#F5A623]">60 minutes</span> typically see a <span className="text-white border-b border-[#F5A623]">40% higher conversion rate</span> on rental inquiries.
             </p>
           </div>
        </aside>

      </div>
    </div>
  )
}

