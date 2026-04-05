'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  /** When server resolved places, show addresses in inputs. */
  pickupPlaceId?: string
  dropoffPlaceId?: string
  pickupAddress?: string
  dropoffAddress?: string
  radiusKm: number
}

export function SearchLocationBar({
  className,
  pickupPlaceId: initialPickupPid,
  dropoffPlaceId: initialDropPid,
  pickupAddress,
  dropoffAddress,
  radiusKm: initialRadius,
}: Props) {
  const router = useRouter()
  const pickupRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLInputElement>(null)
  const acPickupRef = useRef<google.maps.places.Autocomplete | null>(null)
  const acDropRef = useRef<google.maps.places.Autocomplete | null>(null)

  const [pickupPlaceId, setPickupPlaceId] = useState(initialPickupPid ?? '')
  const [dropoffPlaceId, setDropoffPlaceId] = useState(initialDropPid ?? '')
  const [radiusKm, setRadiusKm] = useState(String(initialRadius))
  const [mapsError, setMapsError] = useState<string | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()

  useEffect(() => {
    setPickupPlaceId(initialPickupPid ?? '')
    setDropoffPlaceId(initialDropPid ?? '')
  }, [initialPickupPid, initialDropPid])

  const attachAutocomplete = useCallback(() => {
    if (!apiKey || !pickupRef.current || !dropRef.current) return

    setOptions({ key: apiKey, v: 'weekly' })
    setMapsError(null)

    importLibrary('places')
      .then((places) => {
        if (!pickupRef.current || !dropRef.current) return

        const opts: google.maps.places.AutocompleteOptions = {
          fields: ['place_id', 'formatted_address', 'geometry', 'name'],
          componentRestrictions: { country: 'pk' },
        }

        acPickupRef.current = new places.Autocomplete(pickupRef.current, opts)
        acDropRef.current = new places.Autocomplete(dropRef.current, opts)

        acPickupRef.current.addListener('place_changed', () => {
          const p = acPickupRef.current?.getPlace()
          if (p?.place_id) setPickupPlaceId(p.place_id)
        })
        acDropRef.current.addListener('place_changed', () => {
          const p = acDropRef.current?.getPlace()
          if (p?.place_id) setDropoffPlaceId(p.place_id)
        })
      })
      .catch(() => setMapsError('Could not load Places.'))
  }, [apiKey])

  useEffect(() => {
    attachAutocomplete()
  }, [attachAutocomplete])

  const applySearch = () => {
    if (!pickupPlaceId || !dropoffPlaceId) return
    const q = new URLSearchParams({
      pickupPlaceId,
      dropoffPlaceId,
      radiusKm: radiusKm || '50',
    })
    router.push(`/search?${q.toString()}`)
  }

  if (!apiKey) {
    return (
      <div className={cn('rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground', className)}>
        Set <code className="text-foreground">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to search by location.
      </div>
    )
  }

  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 shadow-sm', className)}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-4 space-y-2">
          <Label htmlFor="search-pickup">Pickup</Label>
          <Input
            ref={pickupRef}
            id="search-pickup"
            name="pickup"
            autoComplete="off"
            placeholder="Search pickup location"
            defaultValue={pickupAddress ?? ''}
            className="bg-background"
          />
        </div>
        <div className="lg:col-span-4 space-y-2">
          <Label htmlFor="search-dropoff">Destination</Label>
          <Input
            ref={dropRef}
            id="search-dropoff"
            name="dropoff"
            autoComplete="off"
            placeholder="Search destination"
            defaultValue={dropoffAddress ?? ''}
            className="bg-background"
          />
        </div>
        <div className="lg:col-span-2 space-y-2">
          <Label>Radius from pickup</Label>
          <Select value={radiusKm} onValueChange={setRadiusKm}>
            <SelectTrigger className="bg-background w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 km</SelectItem>
              <SelectItem value="50">50 km</SelectItem>
              <SelectItem value="75">75 km</SelectItem>
              <SelectItem value="100">100 km</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="lg:col-span-2 flex gap-2">
          <Button type="button" className="w-full" onClick={applySearch}>
            Search
          </Button>
        </div>
      </div>
      {mapsError && <p className="mt-2 text-sm text-destructive">{mapsError}</p>}
      <p className="mt-3 text-xs text-muted-foreground">
        Results are ranked by distance from pickup. Driving route shows your trip; vehicle proximity uses
        straight-line distance to each vendor pickup point.
      </p>
    </div>
  )
}
