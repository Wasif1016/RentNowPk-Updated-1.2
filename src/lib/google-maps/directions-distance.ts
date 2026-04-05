import 'server-only'

import { getGoogleMapsServerKey } from '@/lib/google-maps/config'

export type DrivingRouteSummary = {
  /** Driving distance along roads (km). */
  distanceKm: number
  /** Typical duration in traffic-agnostic model (seconds). */
  durationSeconds: number
}

export type DrivingRouteFull = DrivingRouteSummary & {
  /** Encoded polyline for Maps JavaScript `decodePath`. */
  encodedPolyline: string | null
  /** Viewport to fit the route (optional). */
  bounds: {
    north: number
    south: number
    east: number
    west: number
  } | null
}

const DIRECTIONS_BASE = 'https://maps.googleapis.com/maps/api/directions/json'

type DirectionsJson = {
  status: string
  routes?: Array<{
    bounds?: {
      northeast?: { lat: number; lng: number }
      southwest?: { lat: number; lng: number }
    }
    overview_polyline?: { points?: string }
    legs?: Array<{
      distance?: { value: number }
      duration?: { value: number }
    }>
  }>
}

function parseDirections(data: DirectionsJson): DrivingRouteFull | null {
  if (data.status !== 'OK' || !data.routes?.[0]?.legs?.[0]) {
    return null
  }

  const route = data.routes[0]
  const leg = route.legs![0]
  const meters = leg.distance?.value
  const seconds = leg.duration?.value
  if (meters == null || seconds == null) return null

  const poly = route.overview_polyline?.points ?? null

  let bounds: DrivingRouteFull['bounds'] = null
  const b = route.bounds
  if (b?.northeast && b?.southwest) {
    bounds = {
      north: b.northeast.lat,
      south: b.southwest.lat,
      east: b.northeast.lng,
      west: b.southwest.lng,
    }
  }

  return {
    distanceKm: meters / 1000,
    durationSeconds: seconds,
    encodedPolyline: poly,
    bounds,
  }
}

/**
 * Driving route: distance, duration, encoded polyline for map rendering.
 */
export async function getDrivingRouteFull(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<DrivingRouteFull | null> {
  const key = getGoogleMapsServerKey()
  const origin = `${originLat},${originLng}`
  const destination = `${destLat},${destLng}`
  const params = new URLSearchParams({
    origin,
    destination,
    key,
  })
  const res = await fetch(`${DIRECTIONS_BASE}?${params.toString()}`, {
    next: { revalidate: 0 },
  })
  if (!res.ok) return null

  const data = (await res.json()) as DirectionsJson
  return parseDirections(data)
}

/**
 * Driving distance and duration only (same model as Google Maps driving directions).
 */
export async function getDrivingRouteSummary(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<DrivingRouteSummary | null> {
  const full = await getDrivingRouteFull(originLat, originLng, destLat, destLng)
  if (!full) return null
  return {
    distanceKm: full.distanceKm,
    durationSeconds: full.durationSeconds,
  }
}
