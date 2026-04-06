'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Search, Calendar } from 'lucide-react'

function localInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function HeroSearchWidget() {
  const router = useRouter()
  const pickupRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLInputElement>(null)

  const [pickupPlaceId, setPickupPlaceId] = useState('')
  const [dropoffPlaceId, setDropoffPlaceId] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [pickupAt, setPickupAt] = useState('')
  const [dropoffAt, setDropoffAt] = useState('')
  const [mapsReady, setMapsReady] = useState(false)

  useEffect(() => {
    const now = new Date()
    const start = new Date(now.getTime() + 60 * 60 * 1000)
    const end = new Date(now.getTime() + 48 * 60 * 60 * 1000)
    setPickupAt(localInputValue(start))
    setDropoffAt(localInputValue(end))
  }, [])

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()

  useEffect(() => {
    if (!apiKey || !pickupRef.current || !dropRef.current) return
    let cancelled = false
    setOptions({ key: apiKey, v: 'weekly' })

    importLibrary('places')
      .then((places) => {
        if (cancelled || !pickupRef.current || !dropRef.current) return
        const opts: google.maps.places.AutocompleteOptions = {
          fields: ['place_id', 'formatted_address', 'geometry', 'name'],
          componentRestrictions: { country: 'pk' },
        }
        const acP = new places.Autocomplete(pickupRef.current, opts)
        const acD = new places.Autocomplete(dropRef.current, opts)
        acP.addListener('place_changed', () => {
          const p = acP.getPlace()
          if (p?.place_id) {
            setPickupPlaceId(p.place_id)
            setPickupAddress(p.formatted_address || p.name || '')
          }
        })
        acD.addListener('place_changed', () => {
          const p = acD.getPlace()
          if (p?.place_id) {
            setDropoffPlaceId(p.place_id)
            setDropoffAddress(p.formatted_address || p.name || '')
          }
        })
        setMapsReady(true)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [apiKey])

  const handleSearch = () => {
    if (!pickupPlaceId || !dropoffPlaceId) return
    const params = new URLSearchParams({
      pickupPlaceId,
      dropoffPlaceId,
      radiusKm: '50',
    })
    if (pickupAddress) params.set('pickupAddress', pickupAddress)
    if (dropoffAddress) params.set('dropoffAddress', dropoffAddress)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 sm:p-6 shadow-lg">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-4 space-y-1.5">
            <Label htmlFor="hero-pickup" className="text-xs font-medium flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Pickup
            </Label>
            <Input
              ref={pickupRef}
              id="hero-pickup"
              autoComplete="off"
              placeholder="Where are you?"
              className="bg-background h-10"
            />
          </div>
          <div className="lg:col-span-4 space-y-1.5">
            <Label htmlFor="hero-dropoff" className="text-xs font-medium flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Destination
            </Label>
            <Input
              ref={dropRef}
              id="hero-dropoff"
              autoComplete="off"
              placeholder="Where to?"
              className="bg-background h-10"
            />
          </div>
          <div className="lg:col-span-2 space-y-1.5">
            <Label htmlFor="hero-pickupAt" className="text-xs font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Pickup
            </Label>
            <Input
              id="hero-pickupAt"
              type="datetime-local"
              value={pickupAt}
              onChange={(e) => setPickupAt(e.target.value)}
              className="bg-background h-10"
            />
          </div>
          <div className="lg:col-span-2 flex gap-2">
            <Button
              type="button"
              className="w-full h-10"
              disabled={!pickupPlaceId || !dropoffPlaceId}
              onClick={handleSearch}
            >
              <Search className="h-4 w-4 mr-1.5" />
              Search
            </Button>
          </div>
        </div>
        {!mapsReady && apiKey && (
          <p className="mt-2 text-xs text-muted-foreground">Loading maps…</p>
        )}
        {!apiKey && (
          <p className="mt-2 text-xs text-muted-foreground">Maps not configured — search will use basic filters.</p>
        )}
      </div>
    </div>
  )
}
