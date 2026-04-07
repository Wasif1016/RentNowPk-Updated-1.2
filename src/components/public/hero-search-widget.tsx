'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { Button } from '@/components/ui/button'
import { MapPin, Search, CalendarDays } from 'lucide-react'

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

  const canSearch = pickupPlaceId && dropoffPlaceId

  return (
    <div className="w-full max-w-5xl">
      <div className="rounded-2xl border border-border/50 bg-white p-3 shadow-[0_20px_50px_-15px_rgba(1,82,203,0.1)]">
        <div className="flex flex-col items-stretch gap-2 md:flex-row">
          <div className="flex-1 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group flex items-center rounded-xl border border-border/20 bg-muted/60 px-4 py-3 transition-colors focus-within:border-primary">
              <MapPin className="mr-2 h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                ref={pickupRef}
                autoComplete="off"
                placeholder="Pickup Location"
                className="w-full border-none bg-transparent text-[14px] font-medium outline-none focus:ring-0 placeholder:text-muted-foreground/60"
              />
            </div>

            <div className="group flex items-center rounded-xl border border-border/20 bg-muted/60 px-4 py-3 transition-colors focus-within:border-primary">
              <MapPin className="mr-2 h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                ref={dropRef}
                autoComplete="off"
                placeholder="Drop-off Location"
                className="w-full border-none bg-transparent text-[14px] font-medium outline-none focus:ring-0 placeholder:text-muted-foreground/60"
              />
            </div>

            <div className="group flex items-center rounded-xl border border-border/20 bg-muted/60 px-4 py-3 transition-colors focus-within:border-primary">
              <CalendarDays className="mr-2 h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                type="datetime-local"
                value={pickupAt}
                onChange={(e) => setPickupAt(e.target.value)}
                className="w-full border-none bg-transparent text-[14px] font-medium outline-none focus:ring-0 [color-scheme:light]"
              />
            </div>

            <div className="group flex items-center rounded-xl border border-border/20 bg-muted/60 px-4 py-3 transition-colors focus-within:border-primary">
              <CalendarDays className="mr-2 h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                type="datetime-local"
                value={dropoffAt}
                onChange={(e) => setDropoffAt(e.target.value)}
                className="w-full border-none bg-transparent text-[14px] font-medium outline-none focus:ring-0 [color-scheme:light]"
              />
            </div>
          </div>

          <Button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-[14px] font-bold shadow-lg shadow-primary/20 transition-all md:w-36"
            disabled={!canSearch}
            onClick={handleSearch}
          >
            Search
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {!mapsReady && apiKey && (
        <p className="mt-2 text-center text-xs text-muted-foreground">Loading maps…</p>
      )}
      {!apiKey && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Maps not configured — search will use basic filters.
        </p>
      )}
    </div>
  )
}
