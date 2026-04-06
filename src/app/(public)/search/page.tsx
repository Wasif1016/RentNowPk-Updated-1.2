import { SearchLocationBar } from '@/components/public/search-location-bar'
import { SearchRouteMap } from '@/components/public/search-route-map'
import { VehicleResultCard } from '@/components/public/vehicle-result-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDrivingRouteFull } from '@/lib/google-maps/directions-distance'
import { getPlaceDetails } from '@/lib/google-maps/places-details'
import { searchPublicVehiclesNearPickup } from '@/lib/db/public-vehicles'
import { parseSearchPageQuery } from '@/lib/validation/public-search'

export const metadata = {
  title: 'Search vehicles — RentNowPk',
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const query = parseSearchPageQuery(raw)

  const { pickupPlaceId, dropoffPlaceId, radiusKm } = query

  const hasPair = Boolean(pickupPlaceId && dropoffPlaceId)

  if (!hasPair) {
    return (
      <div className="container mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Find a vehicle</h1>
          <p className="mt-2 text-muted-foreground">
            Choose pickup and destination. We will show the driving route and cars available near your pickup
            point.
          </p>
        </div>
        <SearchLocationBar radiusKm={radiusKm} />
      </div>
    )
  }

  const [pickup, dropoff] = await Promise.all([
    getPlaceDetails(pickupPlaceId!),
    getPlaceDetails(dropoffPlaceId!),
  ])

  if (!pickup || !dropoff) {
    return (
      <div className="container mx-auto max-w-6xl space-y-8 px-4 py-10">
        <SearchLocationBar radiusKm={radiusKm} />
        <p className="text-sm text-destructive">One or both locations could not be resolved. Try again.</p>
      </div>
    )
  }

  const [route, vehicles] = await Promise.all([
    getDrivingRouteFull(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng),
    searchPublicVehiclesNearPickup({
      lat: pickup.lat,
      lng: pickup.lng,
      radiusKm,
      limit: 48,
    }),
  ])

  const durationLabel =
    route != null
      ? `${Math.round(route.durationSeconds / 60)} min`
      : '—'
  const distanceLabel =
    route != null ? `${route.distanceKm.toFixed(1)} km` : '—'

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Find a vehicle</h1>
        <p className="mt-2 text-muted-foreground">
          Driving route and vehicles near your pickup location (within {radiusKm} km).
        </p>
      </div>

      <SearchLocationBar
        pickupPlaceId={pickupPlaceId}
        dropoffPlaceId={dropoffPlaceId}
        pickupAddress={pickup.formattedAddress}
        dropoffAddress={dropoff.formattedAddress}
        radiusKm={radiusKm}
      />

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Your route</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pickup</p>
              <p className="text-sm text-foreground">{pickup.formattedAddress}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Destination</p>
              <p className="text-sm text-foreground">{dropoff.formattedAddress}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground">
              Driving distance:{' '}
              <span className="font-medium text-foreground">{distanceLabel}</span>
            </span>
            <span className="text-muted-foreground">
              Typical drive time:{' '}
              <span className="font-medium text-foreground">{durationLabel}</span>
            </span>
          </div>
          <SearchRouteMap
            encodedPolyline={route?.encodedPolyline ?? null}
            pickup={{ lat: pickup.lat, lng: pickup.lng }}
            dropoff={{ lat: dropoff.lat, lng: dropoff.lng }}
            bounds={route?.bounds ?? null}
          />
        </CardContent>
      </Card>

      <section aria-labelledby="results-heading" className="space-y-4">
        <h2 id="results-heading" className="text-lg font-semibold text-foreground">
          Vehicles near pickup ({vehicles.length})
        </h2>
        {vehicles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active listings within this radius. Try a larger radius or a different pickup area.
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <li key={v.vehicleId}>
                <VehicleResultCard
                  v={v}
                  searchParams={{
                    pickupPlaceId: pickupPlaceId ?? undefined,
                    dropoffPlaceId: dropoffPlaceId ?? undefined,
                    pickupAddress: pickup.formattedAddress,
                    dropoffAddress: dropoff.formattedAddress,
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
