'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { Button } from '@/components/ui/button'
import { MapPin, CalendarDays, Search } from 'lucide-react'

function localInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function TuroHeroSearch() {
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
    const params = new URLSearchParams()
    if (pickupPlaceId) params.set('pickupPlaceId', pickupPlaceId)
    if (dropoffPlaceId) params.set('dropoffPlaceId', dropoffPlaceId)
    params.set('radiusKm', '50')
    if (pickupAddress) params.set('pickupAddress', pickupAddress)
    if (dropoffAddress) params.set('dropoffAddress', dropoffAddress)
    router.push(`/search?${params.toString()}`)
  }

  const canSearch = pickupPlaceId && dropoffPlaceId

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-2 sm:p-3">
        <div className="flex flex-col md:flex-row gap-2">
          {/* Where */}
          <div className="flex-1 relative">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-4 pt-2">
              Where
            </label>
            <div className="flex items-center px-4 pb-2">
              <MapPin className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
              <input
                ref={pickupRef}
                autoComplete="off"
                placeholder="City, airport, or address"
                className="w-full text-[15px] font-medium text-gray-900 bg-transparent border-none outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px bg-gray-200 self-stretch my-2" />

          {/* From */}
          <div className="flex-1 relative">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-4 pt-2">
              From
            </label>
            <div className="flex items-center px-4 pb-2">
              <CalendarDays className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
              <input
                type="datetime-local"
                value={pickupAt}
                onChange={(e) => setPickupAt(e.target.value)}
                className="w-full text-[15px] font-medium text-gray-900 bg-transparent border-none outline-none [color-scheme:light]"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px bg-gray-200 self-stretch my-2" />

          {/* Until */}
          <div className="flex-1 relative">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-4 pt-2">
              Until
            </label>
            <div className="flex items-center px-4 pb-2">
              <CalendarDays className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
              <input
                type="datetime-local"
                value={dropoffAt}
                onChange={(e) => setDropoffAt(e.target.value)}
                className="w-full text-[15px] font-medium text-gray-900 bg-transparent border-none outline-none [color-scheme:light]"
              />
            </div>
          </div>

          {/* Search button */}
          <div className="flex md:flex-col justify-center md:justify-center items-center md:items-end gap-2 md:gap-0 md:pr-2 md:py-2">
            <Button
              type="button"
              className="rounded-full h-12 md:h-full md:w-28 text-base font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-all"
              disabled={!canSearch}
              onClick={handleSearch}
            >
              <Search className="h-4 w-4 mr-1.5" />
              Search
            </Button>
          </div>
        </div>
      </div>

      {!mapsReady && apiKey && (
        <p className="mt-2 text-center text-xs text-white/70">Loading maps…</p>
      )}
    </div>
  )
}
