import Image from 'next/image'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { Location01Icon } from '@hugeicons/core-free-icons'
import { Card, CardContent } from '@/components/ui/card'
import type { PublicVehicleCard } from '@/lib/db/public-vehicles'
import { cn } from '@/lib/utils'

function formatPkDayPrice(decimal: string | null): string | null {
  if (!decimal) return null
  const n = parseFloat(decimal)
  if (Number.isNaN(n)) return null
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(n)
}

export function VehicleResultCard({
  v,
  className,
}: {
  v: PublicVehicleCard
  className?: string
}) {
  const href = `/${v.vendorSlug}/${v.vehicleSlug}`
  const price = formatPkDayPrice(v.minDayPrice)

  return (
    <Link href={href} className={cn('group block', className)}>
      <Card className="h-full overflow-hidden border-border transition-shadow hover:shadow-md">
        <div className="relative aspect-[16/10] bg-muted">
          {v.coverImageUrl ? (
            <Image
              src={v.coverImageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No photo
            </div>
          )}
        </div>
        <CardContent className="space-y-2 p-4">
          <div>
            <p className="font-semibold leading-tight text-foreground group-hover:text-primary">
              {v.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {v.make} {v.model} · {v.year}
            </p>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{v.vendorBusinessName}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <HugeiconsIcon icon={Location01Icon} className="size-3.5 shrink-0" aria-hidden />
              ~{v.distanceKm.toFixed(1)} km from pickup
            </span>
            {price && <span className="font-medium text-foreground">{price} / day</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
