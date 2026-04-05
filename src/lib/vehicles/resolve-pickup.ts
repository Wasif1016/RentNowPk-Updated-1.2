import 'server-only'

import { isWithinPakistanBounds } from '@/lib/geo/bounds'
import {
  clientCoordsMatchPlaceDetails,
  getPlaceDetails,
  reverseGeocode,
} from '@/lib/google-maps/places-details'

export type ResolvedPickup = {
  lat: number
  lng: number
  placeId: string | null
  formattedAddress: string
  /** Locality used for vehicle_cities (from Google address components). */
  cityName: string | null
}

export type ResolvePickupResult =
  | { ok: true; pickup: ResolvedPickup }
  | { ok: false; message: string }

/**
 * Validates client coordinates and resolves canonical address + place id via Google (server).
 * - With `placeId`: Place Details + coordinate tamper check.
 * - Without `placeId`: reverse geocode (e.g. user dragged the pin only).
 */
export async function resolvePickupLocation(input: {
  pickupLatitude: number
  pickupLongitude: number
  pickupPlaceId?: string | null
}): Promise<ResolvePickupResult> {
  const { pickupLatitude: clientLat, pickupLongitude: clientLng } = input
  const trimmedPlaceId = input.pickupPlaceId?.trim() ?? ''

  if (!isWithinPakistanBounds(clientLat, clientLng)) {
    return { ok: false, message: 'Pickup must be within Pakistan.' }
  }

  try {
    if (trimmedPlaceId.length > 0) {
      const details = await getPlaceDetails(trimmedPlaceId)
      if (!details) {
        return {
          ok: false,
          message: 'Invalid pickup place. Search and select again.',
        }
      }
      if (!clientCoordsMatchPlaceDetails(clientLat, clientLng, details)) {
        return {
          ok: false,
          message: 'Pickup pin does not match the selected place.',
        }
      }
      return {
        ok: true,
        pickup: {
          lat: details.lat,
          lng: details.lng,
          placeId: details.placeId,
          formattedAddress: details.formattedAddress,
          cityName: details.cityName,
        },
      }
    }

    const rev = await reverseGeocode(clientLat, clientLng)
    if (!rev?.formattedAddress) {
      return {
        ok: false,
        message: 'Could not resolve pickup address. Move the pin or search again.',
      }
    }
    return {
      ok: true,
      pickup: {
        lat: clientLat,
        lng: clientLng,
        placeId: rev.placeId,
        formattedAddress: rev.formattedAddress,
        cityName: rev.cityName,
      },
    }
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : 'Location service unavailable. Try again.'
    return { ok: false, message: msg }
  }
}
