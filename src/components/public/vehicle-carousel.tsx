'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TuroVehicleCard } from '@/components/public/turo-vehicle-card'
import type { FeaturedVehicleCard } from '@/lib/db/public-vehicles'

type VehicleCarouselProps = {
  title: string
  subtitle: string
  vehicles: FeaturedVehicleCard[]
  showViewAll?: boolean
  viewAllHref?: string
}

export function VehicleCarousel({
  title,
  subtitle,
  vehicles,
  showViewAll = true,
  viewAllHref = '/search',
}: VehicleCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = dir === 'left' ? -600 : 600
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  if (vehicles.length === 0) return null

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {showViewAll && (
            <a
              href={viewAllHref}
              className="text-sm font-semibold text-primary hover:underline underline-offset-4 shrink-0 ml-4"
            >
              View all
            </a>
          )}
        </div>

        <div className="relative">
          {/* Left arrow */}
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 hidden lg:flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Scrollable track */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 -mx-4 px-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {vehicles.map((v) => (
              <TuroVehicleCard
                key={v.vehicleId}
                vehicleId={v.vehicleId}
                vendorSlug={v.vendorSlug}
                vehicleSlug={v.vehicleSlug}
                name={v.name}
                coverImageUrl={v.coverImageUrl}
                minDayPrice={v.minDayPrice}
              />
            ))}
          </div>

          {/* Right arrow */}
          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden lg:flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
