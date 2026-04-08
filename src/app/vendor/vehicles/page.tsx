import Image from 'next/image'
import Link from 'next/link'
import { Plus, Car, MapPin, Eye, EyeOff } from 'lucide-react'
import { getRequiredUser } from '@/lib/auth/session'
import { listVendorVehiclesWithMeta } from '@/lib/db/vendor-vehicles'
import { getVendorProfileByUserId } from '@/lib/db/vendor-profile'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VehicleCreatedToast } from '@/components/vendor/vehicle-created-toast'
import { cn } from '@/lib/utils'

import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card'

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
      <div className="px-6 pt-12 lg:px-12">
        <h1 className="text-4xl font-black text-[#0B1B3D] uppercase tracking-tighter mb-4">Registry Locked</h1>
        <p className="text-[#0B1B3D]/60 font-medium italic">Vendor profile not found.</p>
      </div>
    )
  }

  const rows = await listVendorVehiclesWithMeta(profile.id)
  const showCreated = sp.created === '1'
  const activeCount = rows.filter((r) => r.isActive).length

  return (
    <div className="px-6 pt-10 pb-16 lg:px-12">
      <VehicleCreatedToast show={showCreated} />

      {/* ─── Premium Header ─── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 border-b-4 border-[#0B1B3D] pb-10 relative">
         <div className="absolute -bottom-1 left-0 w-24 h-1.5 bg-[#F5A623]" />
         
         <div>
            <div className="flex items-center gap-3 mb-4">
               <div className="h-2 w-10 bg-[#F5A623]" />
               <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#0B1B3D]/40 leading-none mt-0.5">Asset Registry</h2>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-[#0B1B3D] uppercase leading-none">
               Fleet<span className="text-[#F5A623] italic">Inventory</span>
            </h1>
            <p className="text-[12px] font-bold text-[#0B1B3D]/50 uppercase tracking-tight mt-4 max-w-xl leading-relaxed">
               {rows.length > 0 ? (
                  <>Manage <span className="text-[#0B1B3D]">{activeCount} fully operational</span> and {rows.length - activeCount} offline assets across your defined territories.</>
               ) : (
                  <>Your rental portfolio is currently empty. Initialize your first vehicle to go live.</>
               )}
            </p>
         </div>

         <Button asChild className="bg-[#0B1B3D] text-white border-2 border-[#0B1B3D] rounded-sm text-[11px] font-black uppercase tracking-widest shadow-[4px_4px_0_#F5A623] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all h-12 px-8">
           <Link href="/vendor/vehicles/add">
             <Plus className="h-4 w-4 mr-2 text-[#F5A623]" strokeWidth={4} />
             Add New Asset
           </Link>
         </Button>
      </div>

      {/* ─── Distribution Metrics ─── */}
      {rows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <DashboardStatCard label="Total Units" value={String(rows.length)} icon={Car} />
          <DashboardStatCard label="Active Status" value={String(activeCount)} icon={Eye} />
          <DashboardStatCard label="Internal Cache" value={String(rows.length - activeCount)} icon={EyeOff} />
          <DashboardStatCard label="Service Areas" value={String(new Set(rows.flatMap((r) => r.cities)).size)} icon={MapPin} />
        </div>
      )}

      {/* ─── Grid Display ─── */}
      {rows.length === 0 ? (
        <div className="bg-white border-4 border-dashed border-[#0B1B3D]/20 p-20 text-center rounded-sm">
          <div className="mx-auto h-20 w-20 bg-[#F5A623]/10 border-2 border-[#0B1B3D] rounded-sm flex items-center justify-center mb-6 shadow-[4px_4px_0_#0F1E32]">
            <Car className="h-10 w-10 text-[#0B1B3D]" />
          </div>
          <h3 className="text-xl font-black text-[#0B1B3D] uppercase tracking-tighter mb-2">Registry is Empty</h3>
          <p className="text-xs font-bold text-[#0B1B3D]/40 uppercase tracking-tight mb-8 max-w-xs mx-auto">
            You must list at least one vehicle to appear in marketplace search results.
          </p>
          <Button asChild className="bg-[#0B1B3D] text-white rounded-sm text-[11px] font-black uppercase tracking-widest px-8">
            <Link href="/vendor/vehicles/add">Initialize Asset Registry</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((v) => (
            <div key={v.id} className="group relative bg-white border-4 border-[#0B1B3D] rounded-sm shadow-[6px_6px_0_rgba(11,27,61,0.05)] overflow-hidden transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_rgba(11,27,61,0.1)]">
              {/* Image Section */}
              <div className="relative aspect-[16/10] overflow-hidden border-b-4 border-[#0B1B3D]">
                {v.coverUrl ? (
                  <Image
                    src={v.coverUrl}
                    alt={v.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gray-50 text-[#0B1B3D]/10">
                    <Car className="h-16 w-16" strokeWidth={1} />
                  </div>
                )}
                
                {v.makeLogoUrl && (
                  <div className="absolute top-4 right-4 h-10 w-10 bg-white border-2 border-[#0B1B3D] rounded-sm p-1.5 shadow-md">
                    <Image src={v.makeLogoUrl} alt="" width={40} height={40} className="size-full object-contain" />
                  </div>
                )}

                <div className="absolute top-4 left-4">
                  <div className={cn(
                    "px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] border-2 rounded-full shadow-lg flex items-center gap-1.5",
                    v.isActive ? "bg-[#0B1B3D] text-[#F5A623] border-[#F5A623]" : "bg-white text-gray-400 border-gray-200"
                  )}>
                    <div className={cn("h-1.5 w-1.5 rounded-full", v.isActive ? "bg-[#F5A623]" : "bg-gray-300")} />
                    {v.isActive ? 'Active Registry' : 'Internal Cache'}
                  </div>
                </div>
              </div>

              {/* Data Section */}
              <div className="p-6">
                <h3 className="text-lg font-black text-[#0B1B3D] uppercase tracking-tighter truncate leading-none mb-4 group-hover:text-[#F5A623] transition-colors">
                  {v.name}
                </h3>

                <div className="space-y-3">
                  {v.cities.length > 0 && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[#0B1B3D]/50 uppercase tracking-tight">
                      <MapPin className="h-3.5 w-3.5 text-[#F5A623]" strokeWidth={3} />
                      <span className="truncate">{v.cities.join(' / ')}</span>
                    </div>
                  )}

                  {v.pickupFormattedAddress && (
                    <p className="text-[9px] font-bold text-[#0B1B3D]/30 uppercase tracking-tighter truncate leading-none">
                      LOC: {v.pickupFormattedAddress}
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-5 border-t-2 border-gray-100 flex items-center justify-between">
                   <p className="text-[9px] font-black text-[#0B1B3D]/30 uppercase tracking-[0.3em] font-mono">
                     REG://{v.slug}
                   </p>
                   <Link href={`/vendor/vehicles/${v.id}`} className="text-[10px] font-black uppercase text-[#0B1B3D] underline underline-offset-4 decoration-2 decoration-[#F5A623]">
                      Operations
                   </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
