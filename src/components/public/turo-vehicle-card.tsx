import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type TuroVehicleCardProps = {
  vehicleId: string
  vendorSlug: string
  vehicleSlug: string
  name: string
  coverImageUrl: string | null
  minDayPrice: string | null
  className?: string
}

function formatDayPrice(decimal: string | null): string | null {
  if (!decimal) return null
  const n = parseFloat(decimal)
  if (Number.isNaN(n)) return null
  return `PKR ${n.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`
}

export function TuroVehicleCard({
  vehicleId,
  vendorSlug,
  vehicleSlug,
  name,
  coverImageUrl,
  minDayPrice,
  className,
}: TuroVehicleCardProps) {
  const price = formatDayPrice(minDayPrice)

  return (
    <Link
      href={`/${vendorSlug}/${vehicleSlug}`}
      className={cn(
        'group block shrink-0 w-[280px] sm:w-[300px] rounded-xl overflow-hidden bg-white border border-gray-100 transition-all duration-200 hover:shadow-lg',
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="300px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No photo
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-[15px] font-semibold text-gray-900 truncate">{name}</h3>
        {price && (
          <p className="mt-0.5 text-[14px] text-gray-600">
            {price}<span className="text-gray-400">/day</span>
          </p>
        )}
      </div>
    </Link>
  )
}
