import Link from 'next/link'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { 
  AlertTriangle, 
  BarChart3, 
  Clock, 
  Car, 
  Award, 
  Book, 
  CalendarOff, 
  ArrowRight, 
  ShieldCheck, 
  Lightbulb,
  Image as ImageIcon
} from 'lucide-react'
import { getRequiredUser } from '@/lib/auth/session'
import { getVendorProfileByUserId } from '@/lib/db/vendor-profile'
import {
  getVendorDashboardStats,
  getVendorUpcomingPickups,
  getVendorRecentBookings,
} from '@/lib/db/vendor-dashboard'
import { Button } from '@/components/ui/button'
import { IndustrialCard } from '@/components/dashboard/industrial-card'
import { StatusBadge } from '@/components/dashboard/status-badge'

export default async function VendorDashboardPage() {
  const user = await getRequiredUser('VENDOR')
  const vendorProfile = await getVendorProfileByUserId(user.id)

  if (!vendorProfile) {
    return (
      <div className="py-20 text-center font-sans">
        <h1 className="text-4xl font-bold text-primary uppercase tracking-tighter">Registry Error</h1>
        <p className="text-muted-foreground mt-4">Profile synchronization failed. Contact systems support.</p>
      </div>
    )
  }

  const [stats, upcoming, recent] = await Promise.all([
    getVendorDashboardStats(vendorProfile.id),
    getVendorUpcomingPickups(vendorProfile.id, 3),
    getVendorRecentBookings(vendorProfile.id, 5),
  ])

  return (
    <div className="space-y-10 animate-in fade-in duration-500 font-sans pb-16">
      
      {/* Warning Banner */}
      {vendorProfile.verificationStatus !== 'APPROVED' && (
        <div className="bg-[#feae2c] border-2 border-primary p-6 flex flex-col md:flex-row justify-between items-center gap-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-5">
            <AlertTriangle className="text-primary size-8 shrink-0" />
            <p className="font-bold text-primary uppercase tracking-tight text-base">
              Action Required: Submit your business documents to activate your listings.
            </p>
          </div>
          <Button asChild variant="default" className="w-full md:w-auto px-8 py-6 h-auto text-sm font-bold uppercase border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] bg-primary text-white rounded-none">
            <Link href="/vendor/settings">Start verification</Link>
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border-2 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[20px] font-bold text-primary uppercase tracking-tight mb-3">Customers</p>
          <div className="text-[48px] font-bold text-primary leading-none">{stats.totalBookings}</div>
        </div>

        <div className="bg-white border-2 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[20px] font-bold text-primary uppercase tracking-tight mb-3">Awaiting</p>
          <div className="text-[48px] font-bold text-primary leading-none">{stats.pendingBookings}</div>
        </div>

        <div className="bg-white border-2 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[20px] font-bold text-primary uppercase tracking-tight mb-3">Inventory</p>
          <div className="text-[48px] font-bold text-primary leading-none">{stats.totalVehicles}</div>
        </div>

        <div className="bg-white border-2 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[20px] font-bold text-primary uppercase tracking-tight mb-3">Reliability</p>
          <div className="text-[48px] font-bold text-primary leading-none">{stats.completionRate}%</div>
        </div>
      </div>

      {/* Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Activity */}
        <IndustrialCard 
          title="Recent Activity" 
          icon={<Book className="size-5" />}
          className="lg:col-span-8"
          contentClassName="p-0"
        >
          {recent.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-center">
                <CalendarOff className="text-muted-foreground size-12 mb-4 opacity-10" />
                <p className="text-sm font-bold uppercase text-muted-foreground tracking-widest">No activity found.</p>
             </div>
          ) : (
            <div className="divide-y-2 divide-muted">
              {recent.map((b) => (
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
                        ID: {b.bookingId.slice(0, 6).toUpperCase()} • {b.customerName}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-5">
                      <div className={cn(
                        "inline-block px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-none mb-2 border-2",
                        b.status === 'CONFIRMED' 
                          ? "bg-green-600 text-white border-green-700" 
                          : "bg-[#feae2c] text-primary border-[#d48c1f]"
                      )}>
                        {b.status}
                      </div>
                      <div className="text-2xl font-bold text-primary uppercase tabular-nums tracking-tight">
                        {format(b.pickupAt, 'MMM d')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-5 py-4 border-t-2 border-primary bg-black/[0.02]">
            <Link 
              href="/vendor/bookings" 
              className="text-primary font-bold uppercase text-sm flex items-center gap-2 hover:translate-x-1 transition-transform"
            >
              View History <ArrowRight className="size-4" />
            </Link>
          </div>
        </IndustrialCard>

        {/* Dispatch Queue (Sidebar) */}
        <IndustrialCard 
          title="Queue" 
          icon={<ShieldCheck className="size-5" />}
          className="lg:col-span-4"
        >
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <ShieldCheck className="size-12 mb-5 opacity-10" />
            <p className="font-bold uppercase text-muted-foreground tracking-wider text-xs leading-relaxed">
              Dispatch queue is clear.<br />Stand by for orders.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full mt-6 justify-center bg-transparent text-primary border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-primary hover:text-white transition-all font-bold uppercase text-sm rounded-none h-auto py-3">
            <Link href="/vendor/bookings">View Timeline</Link>
          </Button>
        </IndustrialCard>
      </div>

      {/* Footer Protocol Section */}
      <div className="bg-primary border-2 border-primary p-8 shadow-[6px_6px_0px_0px_#feae2c] flex flex-col lg:flex-row justify-between items-center gap-8 rounded-none">
        <div className="flex gap-6 items-start">
          <div className="bg-[#feae2c] p-4 border-2 border-white transform -rotate-3 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] shrink-0">
            <Lightbulb className="size-7 text-primary" />
          </div>
          <div>
            <h4 className="font-bold uppercase text-[20px] text-[#feae2c] mb-2 tracking-tight">
              Response Protocol
            </h4>
            <p className="font-normal text-base text-white/70 max-w-md leading-relaxed">
              High-velocity responses correlate with increased conversion. Maintain communication within a 60-minute window for optimal results.
            </p>
          </div>
        </div>
        <Button asChild className="bg-white text-primary hover:bg-white/90 px-10 py-4 h-auto text-base font-bold uppercase rounded-none border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-1">
          <Link href="/vendor/settings">View Standards →</Link>
        </Button>
      </div>
    </div>
  )
}
