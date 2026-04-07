import { SearchLocationBar } from '@/components/public/search-location-bar'
import { SearchRouteMap } from '@/components/public/search-route-map'
import { VehicleResultCard } from '@/components/public/vehicle-result-card'
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
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Find a vehicle</h1>
          <p className="mt-2 text-gray-500">
            Choose pickup and destination. We will show the driving route and cars available near your pickup
            point.
          </p>
        </div>
        <div className="mt-8">
          <SearchLocationBar radiusKm={radiusKm} />
        </div>
      </div>
    )
  }

  const [pickup, dropoff] = await Promise.all([
    getPlaceDetails(pickupPlaceId!),
    getPlaceDetails(dropoffPlaceId!),
  ])

  if (!pickup || !dropoff) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-10">
        <SearchLocationBar radiusKm={radiusKm} />
        <p className="mt-4 text-sm text-red-600">One or both locations could not be resolved. Try again.</p>
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
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-2xl mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Find a vehicle</h1>
        <p className="mt-2 text-gray-500">
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

      {route && (
        <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Your route</h2>
          <div className="grid gap-3 md:grid-cols-2 mb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Pickup</p>
              <p className="text-sm text-gray-900">{pickup.formattedAddress}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Destination</p>
              <p className="text-sm text-gray-900">{dropoff.formattedAddress}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm mb-4">
            <span className="text-gray-500">
              Driving distance:{' '}
              <span className="font-medium text-gray-900">{distanceLabel}</span>
            </span>
            <span className="text-gray-500">
              Typical drive time:{' '}
              <span className="font-medium text-gray-900">{durationLabel}</span>
            </span>
          </div>
          <SearchRouteMap
            encodedPolyline={route.encodedPolyline}
            pickup={{ lat: pickup.lat, lng: pickup.lng }}
            dropoff={{ lat: dropoff.lat, lng: dropoff.lng }}
            bounds={route.bounds}
          />
        </div>
      )}

      <section aria-labelledby="results-heading" className="mt-10">
        <h2 id="results-heading" className="text-xl font-bold text-gray-900 mb-6">
          Vehicles near pickup ({vehicles.length})
        </h2>
        {vehicles.length === 0 ? (
          <p className="text-sm text-gray-500">
            No active listings within this radius. Try a larger radius or a different pickup area.
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
