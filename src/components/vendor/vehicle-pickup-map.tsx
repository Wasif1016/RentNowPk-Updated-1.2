'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

/** Default map center (Bahawalnagar, PK) */
const DEFAULT_CENTER = { lat: 29.3956, lng: 71.6832 }

type PickupState = {
  lat: string
  lng: string
  placeId: string
  formattedAddress: string
}

type VehiclePickupMapProps = {
  fieldError?: string
  className?: string
}

export function VehiclePickupMap({ fieldError, className }: VehiclePickupMapProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null)
  /** Radix Tabs mount tab panels after selection; ref can be null on first useEffect — drive map init from this. */
  const [mapHostEl, setMapHostEl] = useState<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mapInstRef = useRef<google.maps.Map | null>(null)
  const markerInstRef = useRef<google.maps.Marker | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const setMapContainerRef = useCallback((el: HTMLDivElement | null) => {
    mapDivRef.current = el
    setMapHostEl(el)
  }, [])

  const [mode, setMode] = useState<'search' | 'map'>('search')
  const [pickup, setPickup] = useState<PickupState>({
    lat: '',
    lng: '',
    placeId: '',
    formattedAddress: '',
  })
  const [mapError, setMapError] = useState<string | null>(null)

  const configError =
    typeof process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === 'string' &&
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.trim().length > 0
      ? null
      : 'Maps are not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.'

  const applyPosition = (
    lat: number,
    lng: number,
    placeId: string,
    formattedAddress: string
  ) => {
    setPickup({
      lat: String(lat),
      lng: String(lng),
      placeId,
      formattedAddress,
    })
  }

  /** Search: Places Autocomplete only (no map). */
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()
    if (!apiKey || mode !== 'search' || configError) return

    let cancelled = false
    setOptions({ key: apiKey, v: 'weekly' })

    importLibrary('places')
      .then(() => {
        if (cancelled || !searchInputRef.current) return

        if (autocompleteRef.current) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current)
          autocompleteRef.current = null
        }

        const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
          fields: ['place_id', 'geometry', 'formatted_address'],
          types: ['geocode'],
        })
        autocompleteRef.current = autocomplete

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (!place.geometry?.location) return
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()
          applyPosition(
            lat,
            lng,
            place.place_id ?? '',
            place.formatted_address ?? ''
          )
        })
      })
      .catch(() => {
        if (!cancelled) setMapError('Could not load Places search.')
      })

    return () => {
      cancelled = true
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
        autocompleteRef.current = null
      }
    }
  }, [mode, configError])

  /** Map: draggable marker only — useLayoutEffect + mapHostEl so we run after Radix mounts the panel. */
  useLayoutEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()
    if (!apiKey || mode !== 'map' || configError || !mapHostEl) return

    let cancelled = false
    setOptions({ key: apiKey, v: 'weekly' })

    Promise.all([importLibrary('maps'), importLibrary('marker')])
      .then(() => {
        if (cancelled || !mapHostEl.isConnected) return

        const lat0 = pickup.lat ? Number.parseFloat(pickup.lat) : DEFAULT_CENTER.lat
        const lng0 = pickup.lng ? Number.parseFloat(pickup.lng) : DEFAULT_CENTER.lng
        const center =
          Number.isFinite(lat0) && Number.isFinite(lng0)
            ? { lat: lat0, lng: lng0 }
            : DEFAULT_CENTER

        const map = new google.maps.Map(mapHostEl, {
          center,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })
        mapInstRef.current = map

        const marker = new google.maps.Marker({
          map,
          position: center,
          draggable: true,
          title: 'Pickup location',
        })
        markerInstRef.current = marker

        requestAnimationFrame(() => {
          if (cancelled) return
          google.maps.event.trigger(map, 'resize')
          map.setCenter(center)
        })

        applyPosition(center.lat, center.lng, pickup.placeId, pickup.formattedAddress)

        marker.addListener('dragend', () => {
          const pos = marker.getPosition()
          if (!pos) return
          applyPosition(pos.lat(), pos.lng(), '', '')
        })
      })
      .catch(() => {
        if (!cancelled) setMapError('Could not load Google Maps.')
      })

    return () => {
      cancelled = true
      const m = mapInstRef.current
      const mk = markerInstRef.current
      if (m) google.maps.event.clearInstanceListeners(m)
      if (mk) google.maps.event.clearInstanceListeners(mk)
      mapInstRef.current = null
      markerInstRef.current = null
    }
    // pickup/placeld only for initial center when host mounts; omit pickup from deps to avoid resetting map on drag
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, configError, mapHostEl])

  const err = configError ?? mapError ?? fieldError

  return (
    <div className={cn('space-y-3', className)}>
      <input type="hidden" name="pickupLatitude" value={pickup.lat} readOnly />
      <input type="hidden" name="pickupLongitude" value={pickup.lng} readOnly />
      <input type="hidden" name="pickupPlaceId" value={pickup.placeId} readOnly />
      <input type="hidden" name="pickupFormattedAddress" value={pickup.formattedAddress} readOnly />

      <Field data-invalid={!!err}>
        <FieldLabel>Pickup location</FieldLabel>
        <FieldDescription>
          Choose how to set the pin. We derive the listing city from this location (Pakistan only).
        </FieldDescription>

        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as 'search' | 'map')}
          className="mt-3 w-full gap-3"
        >
          <TabsList variant="line" className="w-full justify-start">
            <TabsTrigger value="search" className="flex-1 sm:flex-none">
              Search address
            </TabsTrigger>
            <TabsTrigger value="map" className="flex-1 sm:flex-none">
              Pin on map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-3 space-y-2 outline-none">
            <input
              id="pickup-search"
              ref={searchInputRef}
              type="text"
              autoComplete="off"
              placeholder="e.g. Model Town, Lahore"
              disabled={!!configError}
              className={cn(
                'border-input bg-input/30 text-foreground placeholder:text-muted-foreground',
                'focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full min-w-0 rounded-xl border px-3 py-2 text-base transition-colors outline-none focus-visible:ring-[3px] md:text-sm',
                'bg-card border-border'
              )}
            />
            {pickup.formattedAddress ? (
              <p className="text-muted-foreground text-xs leading-relaxed">
                Selected: {pickup.formattedAddress}
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">Pick a suggestion from the list.</p>
            )}
          </TabsContent>

          <TabsContent value="map" className="mt-3 outline-none">
            <div
              ref={setMapContainerRef}
              className="border-border bg-muted h-72 min-h-72 w-full rounded-xl border md:h-96"
              role="presentation"
            />
            <p className="text-muted-foreground mt-2 text-xs">
              Drag the pin to the exact pickup spot. Address will be resolved when you save.
            </p>
          </TabsContent>
        </Tabs>

        {err ? <FieldError>{err}</FieldError> : null}
      </Field>
    </div>
  )
}
