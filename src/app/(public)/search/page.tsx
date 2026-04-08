import { HeroSearchCard } from '@/components/public/hero-search-card'
import { FeaturedVehicleCard } from '@/components/public/featured-vehicle-card'
import { SearchRouteMap } from '@/components/public/search-route-map'
import { SearchHorizontalFilters } from '@/components/public/search-horizontal-filters'
import { getDrivingRouteFull } from '@/lib/google-maps/directions-distance'
import { getPlaceDetails } from '@/lib/google-maps/places-details'
import { getSearchMetadata, searchPublicVehiclesNearPickup } from '@/lib/db/public-vehicles'
import { parseSearchPageQuery } from '@/lib/validation/public-search'
import { Route } from 'lucide-react'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const query = parseSearchPageQuery(raw)
  const metadata = await getSearchMetadata()

  const { pickupPlaceId, dropoffPlaceId, radiusKm } = query
  const hasPair = Boolean(pickupPlaceId && dropoffPlaceId)

  // Fetch locations
  const [pickup, dropoff] = hasPair 
    ? await Promise.all([getPlaceDetails(pickupPlaceId!), getPlaceDetails(dropoffPlaceId!)])
    : [null, null]

  // Redirect or show empty if no locations
  if (!pickup || !dropoff) {
    return (
      <div className="flex flex-col min-h-screen">
        <section className="bg-[#F5A623] pt-24 pb-16 px-4">
           <div className="max-w-[1300px] mx-auto text-center">
             <h1 className="text-4xl font-black text-black uppercase mb-8 shadow-sm">Start Your Search</h1>
             <HeroSearchCard initialRadiusKm={radiusKm.toString()} />
           </div>
        </section>
        <div className="flex-1 flex items-center justify-center p-12 bg-gray-50/50">
           <div className="text-center max-w-md">
             <div className="text-6xl mb-4 grayscale opacity-50">📍</div>
             <p className="text-[#0B1B3D] font-black uppercase tracking-tight text-sm">Select locations to discover available vehicles and driving routes.</p>
           </div>
        </div>
      </div>
    )
  }

  // Fetch route and vehicles
  const [route, vehicles] = await Promise.all([
    getDrivingRouteFull(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng),
    searchPublicVehiclesNearPickup({
      lat: pickup.lat,
      lng: pickup.lng,
      radiusKm,
      limit: 100, // Fetch plenty so we can filter
    }),
  ])

  // Process filters from URL
  const selectedMakes = typeof raw.makes === 'string' ? raw.makes.split(',') : []
  const selectedCities = typeof raw.cities === 'string' ? raw.cities.split(',') : []
  const driveType = (raw.driveType as string) || 'BOTH'

  const filteredVehicles = vehicles.filter((v) => {
    if (selectedMakes.length > 0 && !selectedMakes.includes(v.make)) return false
    if (selectedCities.length > 0 && !selectedCities.includes(v.vendorBusinessName || '')) return false
    if (driveType === 'SELF_DRIVE' && !v.selfDriveEnabled) return false
    if (driveType === 'WITH_DRIVER' && !v.withDriverEnabled) return false
    return true
  })

  const durationLabel = route != null ? `${Math.round(route.durationSeconds / 60)} min` : '—'
  const distanceLabel = route != null ? `${route.distanceKm.toFixed(1)} km` : '—'

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30 font-sans">
      {/* ─── Compact Top Search Section ─── */}
      <section className="bg-[#F5A623] pt-10 pb-6 px-4 border-b-4 border-[#0B1B3D] shadow-inner">
        <div className="max-w-[1440px] mx-auto">
          <HeroSearchCard 
            initialPickupPlaceId={pickupPlaceId}
            initialDropoffPlaceId={dropoffPlaceId}
            initialRadiusKm={radiusKm.toString()}
            initialPickupAddress={pickup.formattedAddress}
            initialDropoffAddress={dropoff.formattedAddress}
          />
          
          {/* HORIZONTAL FILTERS UNDER SEARCH CARD */}
          <div className="mt-4 pt-4 border-t-2 border-[#0B1B3D]/10">
             <SearchHorizontalFilters cities={metadata.cities} />
          </div>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto w-full px-4 lg:px-8 py-8 flex flex-col xl:flex-row gap-8">
        
        {/* 1. Main Center Section: Vehicles (PRIORITY) */}
        <main className="flex-1 min-w-0">
          <div className="flex flex-col gap-8">
            
            {/* Results Header & Summary Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-gray-100 pb-6">
               <div>
                  <h1 className="text-2xl font-black text-[#0B1B3D] uppercase tracking-tighter mb-1">Available Vehicles</h1>
                  <p className="text-[10px] font-bold text-[#0B1B3D]/50 uppercase tracking-[0.2em]">
                    Found {filteredVehicles.length} cars matching your trip
                  </p>
               </div>
               <div className="flex items-center gap-3">
                  <div className="bg-white px-3 py-1.5 border-2 border-[#0B1B3D] rounded-sm text-[11px] font-black uppercase text-[#0B1B3D] shadow-[2px_2px_0_#0B1B3D]">
                    {distanceLabel}
                  </div>
                  <div className="bg-white px-3 py-1.5 border-2 border-[#0B1B3D] rounded-sm text-[11px] font-black uppercase text-[#0B1B3D] shadow-[2px_2px_0_#0B1B3D]">
                    {durationLabel}
                  </div>
               </div>
            </div>

            {/* Expanded Grid (3 columns on lg) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((v) => (
                <FeaturedVehicleCard 
                  key={v.vehicleId} 
                  {...v} 
                  avgRating="5.0" 
                  totalReviews={0}
                />
              ))}
            </div>

            {filteredVehicles.length === 0 && (
              <div className="py-24 text-center bg-white border-4 border-dashed border-[#0B1B3D]/10 rounded-xl">
                <div className="text-6xl mb-6 opacity-30 text-[#0B1B3D]">🚗</div>
                <h3 className="text-xl font-black text-[#0B1B3D] uppercase mb-2">No Matches Found</h3>
                <p className="text-[#0B1B3D]/40 font-bold uppercase tracking-widest text-xs italic">Try adjusting your filters or expanding your search radius.</p>
              </div>
            )}
          </div>
        </main>

        {/* 2. Right Sidebar: Trip Context (Map & Detailed Route) */}
        <aside className="w-full xl:w-[350px] shrink-0 border-t-2 xl:border-t-0 pt-8 xl:pt-0">
          <div className="xl:sticky xl:top-24 space-y-6">
             
             {/* Map Section */}
             <div className="bg-white border-2 border-[#0B1B3D] overflow-hidden rounded-md shadow-[6px_6px_0_#F5A623]">
                <div className="bg-[#0B1B3D] px-4 py-3 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <Route className="h-4 w-4 text-[#F5A623]" />
                      <span className="text-[11px] font-black uppercase text-white tracking-widest leading-none mt-0.5">Trip Context</span>
                   </div>
                </div>
                
                <div className="h-[250px] xl:h-[350px] w-full relative">
                   {route && (
                     <SearchRouteMap
                        encodedPolyline={route.encodedPolyline}
                        pickup={{ lat: pickup.lat, lng: pickup.lng }}
                        dropoff={{ lat: dropoff.lat, lng: dropoff.lng }}
                        bounds={route.bounds}
                     />
                   )}
                </div>

                <div className="p-5 space-y-5 bg-gray-50/80 border-t-2 border-[#0B1B3D]">
                   <div className="flex items-start gap-4">
                      <div className="h-4 w-4 rounded-full bg-green-500 border-2 border-white shadow-sm mt-0.5 shrink-0" />
                      <div>
                         <p className="text-[10px] font-black uppercase text-[#0B1B3D]/30 leading-none mb-1">Pickup Information</p>
                         <p className="text-[12px] font-bold text-[#0B1B3D] leading-tight">{pickup.formattedAddress}</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-4">
                      <div className="h-4 w-4 rounded-full bg-red-500 border-2 border-white shadow-sm mt-0.5 shrink-0" />
                      <div>
                         <p className="text-[10px] font-black uppercase text-[#0B1B3D]/30 leading-none mb-1">Destination</p>
                         <p className="text-[12px] font-bold text-[#0B1B3D] leading-tight">{dropoff.formattedAddress}</p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Info/CTA */}
             <div className="bg-[#0B1B3D] p-5 rounded-md text-white border-2 border-[#0B1B3D] shadow-[4px_4px_0_#F5A623]">
                <h4 className="text-sm font-black text-[#F5A623] uppercase italic mb-2">Distance Search</h4>
                <p className="text-[10px] font-bold text-white/80 leading-relaxed uppercase">
                   We are showing cars within {radiusKm}km of your pickup area. 
                   Booking for a trip? Don't forget to check fuel and toll estimates.
                </p>
             </div>

          </div>
        </aside>

      </div>
    </div>
  )
}
