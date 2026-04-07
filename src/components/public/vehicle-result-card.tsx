import Image from 'next/image'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { Location01Icon } from '@hugeicons/core-free-icons'
import type { PublicVehicleCard } from '@/lib/db/public-vehicles'
import { cn } from '@/lib/utils'

function formatPkDayPrice(decimal: string | null): string | null {
  if (!decimal) return null
  const n = parseFloat(decimal)
  if (Number.isNaN(n)) return null
  return `PKR ${n.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`
}

type SearchParams = {
  pickupPlaceId?: string
  dropoffPlaceId?: string
  pickupAddress?: string
  dropoffAddress?: string
}

export function VehicleResultCard({
  v,
  className,
  searchParams,
}: {
  v: PublicVehicleCard
  className?: string
  searchParams?: SearchParams
}) {
  const params = new URLSearchParams()
  if (searchParams?.pickupPlaceId) params.set('pickupPlaceId', searchParams.pickupPlaceId)
  if (searchParams?.dropoffPlaceId) params.set('dropoffPlaceId', searchParams.dropoffPlaceId)
  if (searchParams?.pickupAddress) params.set('pickupAddress', searchParams.pickupAddress)
  if (searchParams?.dropoffAddress) params.set('dropoffAddress', searchParams.dropoffAddress)

  const paramString = params.toString()
  const href = paramString
    ? `/${v.vendorSlug}/${v.vehicleSlug}?${paramString}`
    : `/${v.vendorSlug}/${v.vehicleSlug}`

  const price = formatPkDayPrice(v.minDayPrice)

  return (
    <Link href={href} className={cn('group block rounded-xl overflow-hidden bg-white border border-gray-100 transition-all duration-200 hover:shadow-lg', className)}>
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {v.coverImageUrl ? (
          <Image
            src={v.coverImageUrl}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No photo
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-[15px] font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
          {v.name}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {v.make} {v.model} · {v.year}
        </p>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <HugeiconsIcon icon={Location01Icon} className="size-3.5 shrink-0" aria-hidden />
            ~{v.distanceKm.toFixed(1)} km
          </span>
          {price && <span className="font-semibold text-primary">{price}/day</span>}
        </div>
      </div>
    </Link>
  )
}
