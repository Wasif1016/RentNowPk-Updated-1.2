import Image from 'next/image'
import Link from 'next/link'
import { Plus, Car, MapPin, Eye, EyeOff } from 'lucide-react'
import { getRequiredUser } from '@/lib/auth/session'
import { listVendorVehiclesWithMeta } from '@/lib/db/vendor-vehicles'
import { getVendorProfileByUserId } from '@/lib/db/vendor-profile'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VehicleCreatedToast } from '@/components/vendor/vehicle-created-toast'

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
      <div className="px-6 pt-8 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Vehicles</h1>
        <p className="text-muted-foreground mt-2">Vendor profile not found.</p>
      </div>
    )
  }

  const rows = await listVendorVehiclesWithMeta(profile.id)
  const showCreated = sp.created === '1'
  const activeCount = rows.filter((r) => r.isActive).length

  return (
    <div className="px-6 pt-8 pb-10 lg:px-8">
      <VehicleCreatedToast show={showCreated} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Vehicles</h1>
          <p className="text-muted-foreground mt-1">
            Manage your fleet. {rows.length > 0 ? `${activeCount} active, ${rows.length - activeCount} inactive.` : 'Add your first vehicle to start receiving bookings.'}
          </p>
        </div>
        <Button asChild size="sm" className="rounded-xl text-sm font-semibold">
          <Link href="/vendor/vehicles/add">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Vehicle
          </Link>
        </Button>
      </div>

      {/* Stats */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total" value={String(rows.length)} />
          <StatCard label="Active" value={String(activeCount)} />
          <StatCard label="Inactive" value={String(rows.length - activeCount)} />
          <StatCard label="Cities" value={String(new Set(rows.flatMap((r) => r.cities)).size)} />
        </div>
      )}

      {/* Vehicle List */}
      {rows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border/50 bg-card/30 p-12 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Car className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No vehicles yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Add your first vehicle to start receiving booking requests from customers.
          </p>
          <Button asChild className="rounded-xl">
            <Link href="/vendor/vehicles/add">
              <Plus className="h-4 w-4 mr-1.5" />
              Add your first vehicle
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card border border-border shadow-sm p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{value}</p>
    </div>
  )
}

function VehicleCard({ vehicle }: { vehicle: import('@/lib/db/vendor-vehicles').VendorVehicleListRow }) {
  return (
    <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {vehicle.coverUrl ? (
          <Image
            src={vehicle.coverUrl}
            alt={vehicle.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Car className="h-10 w-10 opacity-30" />
          </div>
        )}
        {vehicle.makeLogoUrl && (
          <div className="absolute top-3 right-3 h-8 w-8 rounded-lg bg-white/90 p-1 shadow-sm">
            <Image
              src={vehicle.makeLogoUrl}
              alt=""
              width={32}
              height={32}
              className="size-full object-contain"
            />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge
            variant={vehicle.isActive ? 'default' : 'secondary'}
            className={vehicle.isActive ? 'bg-green-600 text-white border-0' : ''}
          >
            {vehicle.isActive ? (
              <><Eye className="h-3 w-3 mr-1" /> Active</>
            ) : (
              <><EyeOff className="h-3 w-3 mr-1" /> Inactive</>
            )}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate">{vehicle.name}</h3>

        {vehicle.cities.length > 0 && (
          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{vehicle.cities.join(', ')}</span>
          </div>
        )}

        {vehicle.pickupFormattedAddress && (
          <p className="text-xs text-muted-foreground/70 mt-1 truncate">
            {vehicle.pickupFormattedAddress}
          </p>
        )}

        <p className="text-xs text-muted-foreground/50 mt-2 font-mono">/{vehicle.slug}</p>
      </div>
    </div>
  )
}
