'use client'

import { useEffect, useRef } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { cn } from '@/lib/utils'

type LatLng = { lat: number; lng: number }

export type SearchRouteMapProps = {
  className?: string
  /** Encoded polyline from Directions API. */
  encodedPolyline: string | null
  pickup: LatLng
  dropoff: LatLng
  bounds?: { north: number; south: number; east: number; west: number } | null
}

export function SearchRouteMap({
  className,
  encodedPolyline,
  pickup,
  dropoff,
  bounds,
}: SearchRouteMapProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()
    if (!apiKey || !ref.current) return

    let cancelled = false
    setOptions({ key: apiKey, v: 'weekly' })

    Promise.all([importLibrary('maps'), importLibrary('geometry')])
      .then(() => {
        if (cancelled || !ref.current) return

        const center = {
          lat: (pickup.lat + dropoff.lat) / 2,
          lng: (pickup.lng + dropoff.lng) / 2,
        }
        const map = new google.maps.Map(ref.current, {
          center,
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        })

        new google.maps.Marker({ position: pickup, map, title: 'Pickup' })
        new google.maps.Marker({ position: dropoff, map, title: 'Destination' })

        let path: google.maps.LatLng[]
        if (encodedPolyline) {
          path = google.maps.geometry.encoding.decodePath(encodedPolyline)
        } else {
          path = [
            new google.maps.LatLng(pickup.lat, pickup.lng),
            new google.maps.LatLng(dropoff.lat, dropoff.lng),
          ]
        }
        new google.maps.Polyline({
          path,
          strokeColor: '#0152cb',
          strokeOpacity: 0.95,
          strokeWeight: 5,
          map,
        })

        if (bounds) {
          map.fitBounds({
            north: bounds.north,
            south: bounds.south,
            east: bounds.east,
            west: bounds.west,
          })
        } else {
          const b = new google.maps.LatLngBounds()
          b.extend(pickup)
          b.extend(dropoff)
          map.fitBounds(b, 48)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [encodedPolyline, pickup.lat, pickup.lng, dropoff.lat, dropoff.lng, bounds])

  const configError =
    typeof process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === 'string' &&
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.trim().length > 0
      ? null
      : 'Maps are not configured.'

  if (configError) {
    return (
      <div
        className={cn(
          'rounded-xl border border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground',
          className
        )}
      >
        {configError}
      </div>
    )
  }

  return <div ref={ref} className={cn('h-[min(420px,55vh)] w-full rounded-xl border border-border', className)} />
}
