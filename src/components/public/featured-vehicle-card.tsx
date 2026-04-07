import Image from 'next/image'
import Link from 'next/link'
import { Star, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type FeaturedVehicleCardProps = {
  vehicleId: string
  vendorSlug: string
  vehicleSlug: string
  name: string
  make: string
  model: string
  year: number
  coverImageUrl: string | null
  withDriverEnabled: boolean
  selfDriveEnabled: boolean
  minDayPrice: string | null
  avgRating: string
  totalReviews: number
  className?: string
}

function formatDayPrice(decimal: string | null): string | null {
  if (!decimal) return null
  const n = parseFloat(decimal)
  if (Number.isNaN(n)) return null
  if (n >= 1000) {
    const k = n / 1000
    return `PKR ${k % 1 === 0 ? k : k.toFixed(1)}k`
  }
  return `PKR ${n.toLocaleString('en-PK')}`
}

export function FeaturedVehicleCard({
  vehicleId,
  vendorSlug,
  vehicleSlug,
  name,
  coverImageUrl,
  withDriverEnabled,
  selfDriveEnabled,
  minDayPrice,
  avgRating,
  totalReviews,
  className,
}: FeaturedVehicleCardProps) {
  const price = formatDayPrice(minDayPrice)
  const isSelfDriveOnly = selfDriveEnabled && !withDriverEnabled
  const badgeLabel = isSelfDriveOnly ? 'Self Drive' : 'With Driver'
  const badgeColor = isSelfDriveOnly
    ? 'bg-secondary/90 text-white'
    : 'bg-primary/90 text-white'

  return (
    <Link
      href={`/${vendorSlug}/${vehicleSlug}`}
      className={cn(
        'group block overflow-hidden rounded-2xl border border-border/30 bg-white transition-all duration-300 hover:shadow-xl',
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
            No photo
          </div>
        )}
        <div className="absolute left-3 top-3">
          <span
            className={cn(
              'rounded px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-sm',
              badgeColor
            )}
          >
            {badgeLabel}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-base font-bold text-foreground">{name}</h3>
          {price && (
            <div className="text-right">
              <div className="text-base font-black text-primary">{price}</div>
              <div className="text-[10px] font-bold uppercase text-muted-foreground/70">
                / day
              </div>
            </div>
          )}
        </div>

        <div className="mt-1 flex items-center gap-2 border-t border-border/50 pt-3">
          <div className="flex flex-1 items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-[12px] font-bold">{parseFloat(avgRating).toFixed(1)}</span>
            <span className="text-[12px] text-muted-foreground">
              ({totalReviews} reviews)
            </span>
          </div>
          <button
            className="rounded-lg bg-primary/5 p-2 text-primary transition-colors hover:bg-primary/10"
            aria-label={`Chat about ${name}`}
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
    </Link>
  )
}
