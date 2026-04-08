import Image from 'next/image'
import Link from 'next/link'
import { Star, ArrowRight, MapPin } from 'lucide-react'
import { getCachedFeaturedVehicles } from '@/lib/db/public-vehicle-cached'

function formatDayPrice(decimal: string | null): string | null {
  if (!decimal) return null
  const n = parseFloat(decimal)
  if (Number.isNaN(n)) return null
  return `PKR ${n.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`
}

export async function RecommendedSection() {
  const vehicles = await getCachedFeaturedVehicles(6)

  if (vehicles.length === 0) return null

  return (
    <section className="py-24 px-4 sm:px-8 w-full mx-auto">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-black tracking-tight mb-2 text-[#0B1B3D]">Recommended for you</h2>
          <div className="h-2 w-24 bg-[#FFB86E] border-b-2 border-[#0B1B3D]" />
        </div>
        <Link 
          href="/search" 
          className="text-[#0B1B3D] font-bold flex items-center gap-2 hover:underline group transition-all"
        >
          View all listings 
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {vehicles.map((v) => {
          const price = formatDayPrice(v.minDayPrice)
          const isSelfDriveOnly = v.selfDriveEnabled && !v.withDriverEnabled
          const badgeLabel = isSelfDriveOnly ? 'Self Drive' : 'With Driver'

          return (
            <div 
              key={v.vehicleId}
              className="bg-white rounded-[24px] border-[3px] border-[#0B1B3D] shadow-[8px_8px_0_#0F1E32] overflow-hidden transition-all hover:-translate-y-2 hover:shadow-[12px_12px_0_#0F1E32] flex flex-col h-full group"
            >
              <Link href={`/${v.vendorSlug}/${v.vehicleSlug}`} className="block relative h-64 overflow-hidden">
                {v.coverImageUrl ? (
                  <Image
                    src={v.coverImageUrl}
                    alt={v.name}
                    fill
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    No photo
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-white px-4 py-1.5 rounded-full border-[2.5px] border-[#0B1B3D] text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_#0B1B3D]">
                  {badgeLabel}
                </div>
              </Link>

              <div className="p-6 flex flex-col flex-1 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-xl font-extrabold tracking-tight text-[#0B1B3D] line-clamp-1">{v.name}</h3>
                  <div className="flex items-center gap-1 bg-[#FFB86E] px-3 py-1 rounded-full border-2 border-[#0B1B3D] text-xs font-bold whitespace-nowrap">
                    <Star className="h-3.5 w-3.5 fill-[#0B1B3D]" />
                    {parseFloat(v.avgRating).toFixed(1)} ({v.totalReviews})
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#5E5E5E] font-bold text-sm">
                    <MapPin className="h-4 w-4" strokeWidth={3} />
                    <span>{v.city || 'Lahore'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[#5E5E5E] font-medium text-sm flex-wrap">
                    <span className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200">{v.make}</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200">{v.model}</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200">{v.year}</span>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-[#0B1B3D]/10 flex justify-between items-center mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Per Day</span>
                    <div className="text-2xl font-black text-[#F8991D]">
                      {price || 'Contact'}
                    </div>
                  </div>
                  <Link 
                    href={`/${v.vendorSlug}/${v.vehicleSlug}`}
                    className="bg-[#0B1B3D] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#FFB86E] hover:text-[#0B1B3D] border-2 border-[#0B1B3D] shadow-[3px_3px_0_#0B1B3D] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
