'use client'

import { useState, useTransition } from 'react'
import { FeaturedVehicleCard as VehicleCardType } from '@/lib/db/public-vehicles'
import { FeaturedVehicleCard } from './featured-vehicle-card'
import { fetchMoreVehiclesAction } from '@/lib/actions/public-vehicles-action'
import { ArrowDown, Loader2 } from 'lucide-react'

interface VehicleListProps {
  initialVehicles: VehicleCardType[]
  searchParams: Record<string, string | string[] | undefined>
}

export function VehicleList({ initialVehicles, searchParams }: VehicleListProps) {
  const [vehicles, setVehicles] = useState<VehicleCardType[]>(initialVehicles)
  const [isPending, startTransition] = useTransition()
  const [hasMore, setHasMore] = useState(initialVehicles.length === 12)
  const [offset, setOffset] = useState(12)

  // When props change (e.g. filters update), reset local state
  // Actually, in Next.js, when the Parent (Page) re-renders due to URL change, 
  // props will update. We should sync them.
  useState(() => {
    // This is for the first render, but we need to handle subsequent prop updates.
  })

  // Better way to sync with initialVehicles when they change due to filters
  // We use a key on the component in the parent to force a reset, or handle it here.
  // We'll use a key in the Car page.

  const loadMore = () => {
    startTransition(async () => {
      const more = await fetchMoreVehiclesAction({
        make: typeof searchParams.makes === 'string' ? searchParams.makes.split(',') : undefined,
        city: typeof searchParams.cities === 'string' ? searchParams.cities.split(',') : undefined,
        driveType: (searchParams.driveType as any) || 'BOTH',
        limit: 12,
        offset: offset
      })

      if (more.length < 12) {
        setHasMore(false)
      }
      setVehicles(prev => [...prev, ...more])
      setOffset(prev => prev + 12)
    })
  }

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white border-2 border-[#0B1B3D] rounded-md shadow-[6px_6px_0_#0F1E32]">
        <div className="w-20 h-20 bg-[#F5A623] border-4 border-[#0B1B3D] rounded-full flex items-center justify-center mb-6 shadow-[4px_4px_0_#0B1B3D]">
          <span className="text-4xl">🚗</span>
        </div>
        <h3 className="text-2xl font-black text-[#0B1B3D] uppercase tracking-tight mb-2">No Cars Found</h3>
        <p className="text-[#0B1B3D]/60 font-bold max-w-sm">
          We couldn't find any cars matching your filters. Try clearing some filters or searching in a different city.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((v) => (
          <FeaturedVehicleCard key={v.vehicleId} {...v} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pb-10">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="group relative flex items-center gap-3 bg-white border-4 border-[#0B1B3D] px-8 py-4 font-black uppercase tracking-widest text-[#0B1B3D] shadow-[6px_6px_0_#0B1B3D] hover:shadow-[2px_2px_0_#0B1B3D] hover:translate-x-[4px] hover:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Load More Cars
                <ArrowDown className="h-5 w-5 group-hover:translate-y-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
