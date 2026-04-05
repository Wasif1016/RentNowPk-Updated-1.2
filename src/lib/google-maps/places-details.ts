import 'server-only'

import { getGoogleMapsServerKey } from '@/lib/google-maps/config'
import { haversineDistanceMeters } from '@/lib/geo/haversine'

export type PlaceDetailsResult = {
  placeId: string
  lat: number
  lng: number
  formattedAddress: string
  /** Best-effort city/locality for vehicle_cities (Pakistan). */
  cityName: string | null
}

/** Prefer locality, then district, then sublocality. */
export function extractCityFromAddressComponents(
  components: Array<{ long_name: string; short_name: string; types: string[] }> | undefined
): string | null {
  if (!components?.length) return null
  const priority = [
    'locality',
    'administrative_area_level_2',
    'sublocality_level_1',
    'sublocality',
    'administrative_area_level_3',
  ]
  for (const type of priority) {
    const c = components.find((x) => x.types.includes(type))
    const t = c?.long_name?.trim()
    if (t && t.length > 0) return t
  }
  return null
}

const DETAILS_BASE = 'https://maps.googleapis.com/maps/api/place/details/json'

/**
 * Fetch canonical geometry + address for a Place ID (server-side).
 */
export async function getPlaceDetails(
  placeId: string
): Promise<PlaceDetailsResult | null> {
  const key = getGoogleMapsServerKey()
  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'geometry,formatted_address,place_id,address_components',
    key,
  })
  const res = await fetch(`${DETAILS_BASE}?${params.toString()}`, {
    next: { revalidate: 0 },
  })
  if (!res.ok) return null

  const data = (await res.json()) as {
    status: string
    result?: {
      place_id?: string
      formatted_address?: string
      geometry?: { location?: { lat: number; lng: number } }
      address_components?: Array<{
        long_name: string
        short_name: string
        types: string[]
      }>
    }
  }

  if (data.status !== 'OK' || !data.result?.geometry?.location) {
    return null
  }

  const loc = data.result.geometry.location
  const cityName = extractCityFromAddressComponents(data.result.address_components)
  return {
    placeId: data.result.place_id ?? placeId,
    lat: loc.lat,
    lng: loc.lng,
    formattedAddress: data.result.formatted_address ?? '',
    cityName,
  }
}

/** Max distance (meters) between client-submitted coords and Places API geometry. */
const VERIFY_TOLERANCE_M = 200

/**
 * Ensures client lat/lng matches Google's Place Details (anti-tamper).
 */
export function clientCoordsMatchPlaceDetails(
  clientLat: number,
  clientLng: number,
  official: PlaceDetailsResult
): boolean {
  const m = haversineDistanceMeters(
    clientLat,
    clientLng,
    official.lat,
    official.lng
  )
  return m <= VERIFY_TOLERANCE_M
}

const GEOCODE_BASE = 'https://maps.googleapis.com/maps/api/geocode/json'

export type ReverseGeocodeResult = {
  formattedAddress: string
  placeId: string | null
  cityName: string | null
}

/**
 * Reverse geocode when the user adjusted the pin without a Places selection.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  const key = getGoogleMapsServerKey()
  const params = new URLSearchParams({
    latlng: `${lat},${lng}`,
    key,
  })
  const res = await fetch(`${GEOCODE_BASE}?${params.toString()}`, {
    next: { revalidate: 0 },
  })
  if (!res.ok) return null

  const data = (await res.json()) as {
    status: string
    results?: Array<{
      formatted_address?: string
      place_id?: string
      address_components?: Array<{
        long_name: string
        short_name: string
        types: string[]
      }>
    }>
  }

  if (data.status !== 'OK' || !data.results?.[0]) {
    return null
  }

  const first = data.results[0]
  const cityName = extractCityFromAddressComponents(first.address_components)
  return {
    formattedAddress: first.formatted_address ?? '',
    placeId: first.place_id ?? null,
    cityName,
  }
}
