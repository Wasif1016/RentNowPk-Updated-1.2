import Link from 'next/link'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { 
  Search, 
  Globe, 
  Car, 
  Clock, 
  ShieldCheck, 
  History, 
  MapPin, 
  ArrowRight, 
  Compass,
  CalendarOff,
  Lightbulb
} from 'lucide-react'
import { getRequiredUser } from '@/lib/auth/session'
import {
  getCustomerDashboardStats,
  getCustomerRecentBookings,
  getCustomerUpcomingBookings,
} from '@/lib/db/customer-dashboard'
import { Button } from '@/components/ui/button'
import { IndustrialCard } from '@/components/dashboard/industrial-card'

export default async function CustomerDashboardPage() {
  const user = await getRequiredUser('CUSTOMER')

  const [stats, recent, upcoming] = await Promise.all([
    getCustomerDashboardStats(user.id),
    getCustomerRecentBookings(user.id, 5),
    getCustomerUpcomingBookings(user.id, 3),
  ])

  return (
    <div className="space-y-10 animate-in fade-in duration-500 font-sans pb-16">
      
      {/* Search Prompt Banner */}
      <div className="bg-[#f0f3ff] border-2 border-primary p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 bg-primary border-2 border-primary flex items-center justify-center shadow-[4px_4px_0px_0px_#feae2c] shrink-0">
             <Search className="text-[#feae2c] size-6" />
          </div>
          <div>
            <p className="font-bold text-primary uppercase tracking-tight text-[20px] mb-1">Ready for your next journey?</p>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Find verified vehicles available across Pakistan.</p>
          </div>
        </div>
        <Button asChild className="w-full md:w-auto px-8 py-6 h-auto text-sm font-bold uppercase border-2 border-primary shadow-[4px_4px_0px_0px_#feae2c] bg-primary text-white rounded-none">
          <Link href="/search">Locate Vehicle</Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border-2 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[20px] font-bold text-primary uppercase tracking-tight mb-3">Journeys</p>
          <div className="text-[48px] font-bold text-primary leading-none">{stats.totalBookings}</div>
        </div>

        <div className="bg-white border-2 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[20px] font-bold text-primary uppercase tracking-tight mb-3">In Transit</p>
          <div className="text-[48px] font-bold text-primary leading-none">{stats.activeBookings}</div>
        </div>

        <div className="bg-white border-2 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[20px] font-bold text-primary uppercase tracking-tight mb-3">Awaiting</p>
          <div className="text-[48px] font-bold text-primary leading-none">{stats.pendingBookings}</div>
        </div>

        <div className="bg-white border-2 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[20px] font-bold text-primary uppercase tracking-tight mb-3">Verified</p>
          <div className="text-[48px] font-bold text-primary leading-none">{stats.completedBookings}</div>
        </div>
      </div>

      {/* Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Rental Timeline */}
        <IndustrialCard 
          title="Recent Activity" 
          icon={<History className="size-5" />}
          className="lg:col-span-8"
          contentClassName="p-0"
        >
          {recent.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-center">
                <CalendarOff className="text-muted-foreground size-12 mb-4 opacity-10" />
                <p className="text-sm font-bold uppercase text-muted-foreground tracking-widest">No transaction history.</p>
             </div>
          ) : (
            <div className="divide-y-2 divide-muted">
              {recent.map((b) => (
                <div key={b.bookingId} className="flex items-center hover:bg-black/[0.02] transition-colors group">
                  <div className="w-24 h-24 border-r-2 border-primary flex items-center justify-center bg-muted shrink-0">
                    <MapPin className="size-8 text-primary opacity-30" />
                  </div>
                  <div className="flex-1 p-5 flex justify-between items-center min-w-0">
                    <div className="min-w-0 pr-4">
                      <div className="text-base font-bold uppercase tracking-tight truncate mb-1">
                        {b.vehicleName}
                      </div>
                      <div className="text-xs font-bold text-muted-foreground uppercase opacity-70">
                        {b.vendorBusinessName} • {format(b.pickupAt, 'MMM d, yyyy')}
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
                        {format(b.pickupAt, 'h:mm a')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-5 py-4 border-t-2 border-primary bg-black/[0.02]">
            <Link 
              href="/customer/bookings" 
              className="text-primary font-bold uppercase text-sm flex items-center gap-2 hover:translate-x-1 transition-transform"
            >
              View History <ArrowRight className="size-4" />
            </Link>
          </div>
        </IndustrialCard>

        {/* Navigation / Compass */}
        <IndustrialCard 
          title="Compass" 
          icon={<Compass className="size-5" />}
          className="lg:col-span-4"
        >
          <div className="flex flex-col items-center justify-center py-14 text-center">
             <Compass className="text-primary size-12 mb-5 opacity-10" />
             <p className="font-bold uppercase text-muted-foreground tracking-wider text-xs leading-relaxed">
               Route optimization active.<br/>No active dispatches.
             </p>
          </div>
          <Button asChild variant="outline" className="w-full mt-6 justify-center bg-transparent text-primary border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-primary hover:text-white transition-all font-bold uppercase text-sm rounded-none h-auto py-3">
            <Link href="/search">Browse Map</Link>
          </Button>
        </IndustrialCard>
      </div>

      {/* Footer / Safety Section */}
      <div className="bg-primary border-2 border-primary p-8 shadow-[6px_6px_0px_0px_#feae2c] flex flex-col lg:flex-row justify-between items-center gap-8 rounded-none">
        <div className="flex gap-6 items-start">
          <div className="bg-[#feae2c] p-4 border-2 border-white transform -rotate-3 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] shrink-0">
            <ShieldCheck className="size-7 text-primary" />
          </div>
          <div>
            <h4 className="font-bold uppercase text-[20px] text-[#feae2c] mb-2 tracking-tight">
              Safety Protocol
            </h4>
            <p className="font-normal text-base text-white/70 max-w-md leading-relaxed">
              Verified partners consistently achieve higher success rates. Prioritize listings with the shield badge for maximum reliability.
            </p>
          </div>
        </div>
        <Button asChild className="bg-white text-primary hover:bg-white/90 px-10 py-4 h-auto text-base font-bold uppercase rounded-none border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-1">
          <Link href="/customer/settings">Safety Standards →</Link>
        </Button>
      </div>
    </div>
  )
}
