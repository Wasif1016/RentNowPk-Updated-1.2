import Link from 'next/link'
import { cn } from '@/lib/utils'
import { 
  Users, 
  CarFront, 
  Clock, 
  CalendarCheck, 
  UserCheck, 
  AlertCircle,
  Car,
  ShieldCheck,
  ArrowRight,
  Book,
  Lightbulb
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { 
  getAdminDashboardStats, 
  getAdminPendingVendors, 
  getAdminRecentBookings 
} from '@/lib/db/admin-dashboard'
import { Button } from '@/components/ui/button'
import { IndustrialCard } from '@/components/dashboard/industrial-card'

export default async function AdminDashboardPage() {
  const [stats, pendingVendors, recentBookings] = await Promise.all([
    getAdminDashboardStats(),
    getAdminPendingVendors(5),
    getAdminRecentBookings(5),
  ])

  return (
    <div className="space-y-10 animate-in fade-in duration-500 font-sans pb-16">
      
      {/* Platform Banner */}
      <div className="bg-[#f0f3ff] border-2 border-primary p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 bg-primary border-2 border-primary flex items-center justify-center shadow-[4px_4px_0px_0px_#feae2c] shrink-0">
             <ShieldCheck className="text-[#feae2c] size-6" />
          </div>
          <div>
            <p className="font-bold text-primary uppercase tracking-tight text-[20px] mb-1">Platform Operations</p>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Active monitoring and moderation queue.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button asChild variant="outline" className="px-6 py-6 h-auto text-xs font-bold uppercase border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white text-primary rounded-none">
            <Link href="/admin/vendors">All Vendors</Link>
          </Button>
          <Button asChild className="px-6 py-6 h-auto text-xs font-bold uppercase border-2 border-primary shadow-[4px_4px_0px_0px_#feae2c] bg-primary text-white rounded-none">
            <Link href="/admin/bookings">All Bookings</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border-2 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[20px] font-bold text-primary uppercase tracking-tight mb-3">Total Users</p>
          <div className="text-[48px] font-bold text-primary leading-none">{stats.totalUsers}</div>
        </div>

        <div className="bg-white border-2 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[20px] font-bold text-primary uppercase tracking-tight mb-3">Verifications</p>
          <div className="text-[48px] font-bold text-primary leading-none">{stats.pendingVerifications}</div>
        </div>

        <div className="bg-white border-2 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[20px] font-bold text-primary uppercase tracking-tight mb-3">Active Trips</p>
          <div className="text-[48px] font-bold text-primary leading-none">{stats.activeBookings}</div>
        </div>

        <div className="bg-white border-2 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[20px] font-bold text-primary uppercase tracking-tight mb-3">Inventory</p>
          <div className="text-[48px] font-bold text-primary leading-none">{stats.totalVehicles}</div>
        </div>
      </div>

      {/* Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Bookings */}
        <IndustrialCard 
          title="Recent Bookings" 
          icon={<Book className="size-5" />}
          className="lg:col-span-8"
          contentClassName="p-0"
        >
          {recentBookings.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-center">
                <Clock className="text-muted-foreground size-12 mb-4 opacity-10" />
                <p className="text-sm font-bold uppercase text-muted-foreground tracking-widest">No platform activity.</p>
             </div>
          ) : (
            <div className="divide-y-2 divide-muted">
              {recentBookings.map((b) => (
                <div key={b.bookingId} className="flex items-center hover:bg-black/[0.02] transition-colors group">
                  <div className="w-24 h-24 border-r-2 border-primary flex items-center justify-center bg-muted shrink-0">
                    <Car className="size-8 text-primary opacity-30" />
                  </div>
                  <div className="flex-1 p-5 flex justify-between items-center min-w-0">
                    <div className="min-w-0 pr-4">
                      <div className="text-base font-bold uppercase tracking-tight truncate mb-1">
                        {b.vehicleName}
                      </div>
                      <div className="text-xs font-bold text-muted-foreground uppercase opacity-70">
                         {b.customerName} • {b.vendorBusinessName}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-5">
                      <div className={cn(
                        "inline-block px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-none mb-2 border-2",
                        ['CONFIRMED', 'COMPLETED', 'ACTIVE'].includes(b.status) 
                          ? "bg-green-600 text-white border-green-700" 
                          : "bg-[#feae2c] text-primary border-[#d48c1f]"
                      )}>
                        {b.status}
                      </div>
                      <div className="text-2xl font-bold text-primary uppercase tabular-nums tracking-tight">
                        {formatDistanceToNow(new Date(b.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-5 py-4 border-t-2 border-primary bg-black/[0.02]">
            <Link 
              href="/admin/bookings" 
              className="text-primary font-bold uppercase text-sm flex items-center gap-2 hover:translate-x-1 transition-transform"
            >
              View Full History <ArrowRight className="size-4" />
            </Link>
          </div>
        </IndustrialCard>

        {/* Verification Queue */}
        <IndustrialCard 
          title="Queue" 
          icon={<AlertCircle className="size-5" />}
          className="lg:col-span-4"
          contentClassName="p-0"
        >
          {pendingVendors.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <UserCheck className="text-primary size-12 mb-5 opacity-10" />
                <p className="font-bold uppercase text-muted-foreground tracking-wider text-xs leading-relaxed">
                  Verification queue is clear.<br/>All vendors approved.
                </p>
             </div>
          ) : (
            <div className="divide-y-2 divide-muted">
              {pendingVendors.map((v) => (
                <div key={v.vendorId} className="p-5 flex justify-between items-center bg-white hover:bg-black/[0.02] transition-colors">
                  <div className="min-w-0">
                    <p className="font-bold text-primary uppercase text-sm truncate">{v.businessName || v.publicSlug}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                      {v.submittedAt ? formatDistanceToNow(new Date(v.submittedAt), { addSuffix: true }) : 'Pending'}
                    </p>
                  </div>
                  <Link
                    href="/admin/vendors"
                    className="text-primary text-[10px] font-bold uppercase border-2 border-primary px-3 py-1 bg-[#feae2c] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
          <div className="p-5">
            <Button asChild variant="outline" className="w-full justify-center bg-transparent text-primary border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-primary hover:text-white transition-all font-bold uppercase text-sm rounded-none h-auto py-3">
              <Link href="/admin/vendors">All Vendors</Link>
            </Button>
          </div>
        </IndustrialCard>
      </div>

      {/* Footer / Moderation Protocol */}
      <div className="bg-primary border-2 border-primary p-8 shadow-[6px_6px_0px_0px_#feae2c] flex flex-col lg:flex-row justify-between items-center gap-8 rounded-none">
        <div className="flex gap-6 items-start">
          <div className="bg-[#feae2c] p-4 border-2 border-white transform -rotate-3 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] shrink-0">
            <Lightbulb className="size-7 text-primary" />
          </div>
          <div>
            <h4 className="font-bold uppercase text-[20px] text-[#feae2c] mb-2 tracking-tight">
              Moderation Protocol
            </h4>
            <p className="font-normal text-base text-white/70 max-w-md leading-relaxed">
              Verify vendor documents within the standard 24-hour SLA. Consistent review times directly impact platform liquidity and trust.
            </p>
          </div>
        </div>
        <Button asChild className="bg-white text-primary hover:bg-white/90 px-10 py-4 h-auto text-base font-bold uppercase rounded-none border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-1">
          <Link href="/admin/vendors">Review Vendors →</Link>
        </Button>
      </div>
    </div>
  )
}
