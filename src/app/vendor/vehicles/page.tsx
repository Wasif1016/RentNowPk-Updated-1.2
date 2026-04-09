import Image from 'next/image'
import Link from 'next/link'
import { Plus, Car, MapPin, Eye, EyeOff, LayoutGrid } from 'lucide-react'
import { getRequiredUser } from '@/lib/auth/session'
import { listVendorVehiclesWithMeta } from '@/lib/db/vendor-vehicles'
import { getVendorProfileByUserId } from '@/lib/db/vendor-profile'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card'

import { IndustrialCard } from '@/components/dashboard/industrial-card'
import { StatusBadge } from '@/components/dashboard/status-badge'

export default async function VendorVehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>
}) {
  const sp = await searchParams
  const user = await getRequiredUser('VENDOR')
  const profile = await getVendorProfileByUserId(user.id)
  
  if (!profile) {
    return (
      <div className="py-20 text-center font-sans">
        <h1 className="text-4xl font-bold text-primary uppercase tracking-tighter">Registry Locked</h1>
        <p className="text-muted-foreground mt-4">Vendor profile not found.</p>
      </div>
    )
  }

  const rows = await listVendorVehiclesWithMeta(profile.id)
  const activeCount = rows.filter((r) => r.isActive).length

  return (
    <div className="space-y-10 animate-in fade-in duration-500 font-sans pb-16">
      
      {/* Page Header (Add Asset button only, as per mockup) */}
      <header className="flex justify-end mb-2">
        <Button asChild className="bg-white text-primary hover:bg-muted px-6 py-3.5 h-auto text-sm font-bold border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
          <Link href="/vendor/vehicles/add">+ Add asset</Link>
        </Button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Inventory */}
        <div className="bg-white border-2 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[20px] font-bold text-primary mb-3">Inventory</p>
          <div className="text-[48px] font-bold text-primary leading-none">{rows.length}</div>
        </div>

        {/* Online (Amber variant) */}
        <div className="bg-[#feae2c] border-2 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[20px] font-bold text-primary mb-3">Online</p>
          <div className="text-[48px] font-bold text-primary leading-none">{activeCount}</div>
        </div>

        {/* Drafts */}
        <div className="bg-white border-2 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[20px] font-bold text-primary mb-3">Drafts</p>
          <div className="text-[48px] font-bold text-primary leading-none">{rows.length - activeCount}</div>
        </div>

        {/* Deployment */}
        <div className="bg-white border-2 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[20px] font-bold text-primary mb-3">Deployment</p>
          <div className="text-[48px] font-bold text-primary leading-none">
            {new Set(rows.flatMap((r) => r.cities)).size}
          </div>
        </div>
      </div>

      {/* Main Registry Card */}
      <div className="bg-white border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden">
        <div className="px-6 py-5 border-b-2 border-primary bg-[#f0f3ff] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-primary tracking-tight">Vehicle registry</h3>
            <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase mt-1">Full operational overview of your rental fleet</p>
          </div>
        </div>

        {/* Vehicle Grid */}
        <div className="p-6">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Car className="text-primary size-12 mb-4 opacity-10" />
              <p className="text-sm font-bold uppercase text-muted-foreground tracking-widest">No assets found.</p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rows.map((v) => (
                <div key={v.id} className="group bg-white border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                  <div className="relative aspect-[16/10] overflow-hidden border-b-2 border-primary bg-slate-900 flex items-center justify-center">
                    {v.coverUrl ? (
                      <Image 
                        src={v.coverUrl} 
                        alt={v.name} 
                        fill 
                        sizes="300px" 
                        className="object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    ) : (
                      <Car className="h-10 w-10 text-white/10" />
                    )}
                    <div className={cn(
                      "absolute top-2 left-2 px-2.5 py-1 text-[10px] font-bold border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors",
                      v.isActive ? "bg-[#16A34A] text-white" : "bg-white text-primary"
                    )}>
                      {v.isActive ? 'Active' : 'Offline'}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h4 className="text-base font-bold text-primary leading-tight tracking-tight truncate">
                        {v.name}
                      </h4>
                      <span className="text-[11px] font-bold text-primary bg-muted px-2 py-0.5 border-2 border-primary shrink-0 leading-normal">
                        {v.year}
                      </span>
                    </div>

                    <div className="text-[11px] font-bold text-muted-foreground tracking-tight mb-2 truncate">
                      {v.cities.length > 0 
                        ? `${v.cities[0]}${v.cities.length > 1 ? `, ${v.cities[1]}${v.cities.length > 2 ? ` +${v.cities.length - 2}` : ''}` : ''}` 
                        : 'Remote availability'}
                    </div>

                    <div className="text-[10px] font-bold text-muted-foreground/40 tracking-widest mb-4 truncate uppercase opacity-50">
                      {v.slug}
                    </div>

                    <div className="mt-auto pt-4">
                      <Button asChild variant="outline" className="w-full bg-transparent text-primary hover:bg-primary hover:text-white border-2 border-primary font-bold text-[12px] h-auto py-2.5 rounded-none transition-all">
                        <Link href={`/vendor/vehicles/${v.id}`}>Manage unit</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
