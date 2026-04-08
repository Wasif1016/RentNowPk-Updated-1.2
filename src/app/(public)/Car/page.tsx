import { Suspense } from 'react'
import { HeroSearchCard } from '@/components/public/hero-search-card'
import { CarFilterSidebar } from '@/components/public/car-filter-sidebar'
import { VehicleList } from '@/components/public/vehicle-list'
import { getSearchMetadata, searchVehiclesGeneric } from '@/lib/db/public-vehicles'

interface CarPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function CarPage({ searchParams }: CarPageProps) {
  const params = await searchParams
  const metadata = await getSearchMetadata()

  // Prepare filter params from URL
  const searchFilter = {
    make: typeof params.makes === 'string' ? params.makes.split(',') : undefined,
    city: typeof params.cities === 'string' ? params.cities.split(',') : undefined,
    driveType: (params.driveType as any) || 'BOTH',
    limit: 12,
    offset: 0
  }

  const initialVehicles = await searchVehiclesGeneric(searchFilter)

  return (
    <div className="flex flex-col min-h-screen">
      {/* ─── Hero Section (amber pinstripe) ─── */}
      <section className="relative bg-[#F5A623] overflow-hidden pt-12 pb-16 px-4 sm:px-8">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(0,0,0,0.08) 28px, rgba(0,0,0,0.08) 29px)',
          }}
        />
        
        <div className="relative z-10 max-w-[1300px] mx-auto text-center">
          <div className="inline-block bg-black text-[#F5A623] text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-sm mb-4">
            Browse All Vehicles
          </div>
          <h1 className="text-[32px] sm:text-[48px] font-black leading-tight text-black mb-6 uppercase italic tracking-tighter shadow-sm">
            Find Your <span className="text-white drop-shadow-[2px_2px_0_#000]">Perfect</span> Drive
          </h1>
          
          <HeroSearchCard />
        </div>
      </section>

      {/* ─── Main Content ─── */}
      <div className="max-w-[1300px] mx-auto w-full px-4 md:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Sidebar */}
          <aside className="w-full lg:w-[280px] shrink-0">
            <div className="sticky top-24 bg-[#F5A623]/5 border-2 border-[#0B1B3D] p-6 rounded-md shadow-[4px_4px_0_#0B1B3D]">
              <CarFilterSidebar metadata={metadata} />
            </div>
          </aside>

          {/* Main List */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-gray-100">
               <h2 className="text-sm font-black text-[#0B1B3D]/40 uppercase tracking-[0.2em]">
                Showing {initialVehicles.length} Result{initialVehicles.length !== 1 ? 's' : ''}
               </h2>
               <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-[#0B1B3D]/40 uppercase tracking-widest">Sort by:</span>
                 <select className="bg-transparent text-xs font-black text-[#0B1B3D] uppercase border-none focus:ring-0 cursor-pointer">
                   <option>Highest Rated</option>
                   <option>Price: Low to High</option>
                   <option>Price: High to Low</option>
                 </select>
               </div>
            </div>

            <Suspense fallback={<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 aspect-[4/5] rounded-2xl border-2 border-gray-200" />
              ))}
            </div>}>
              {/* Force re-render of VehicleList when filters change to reset its internal offset/state */}
              <VehicleList 
                key={JSON.stringify(searchFilter)} 
                initialVehicles={initialVehicles} 
                searchParams={params} 
              />
            </Suspense>
          </main>

        </div>
      </div>
    </div>
  )
}
