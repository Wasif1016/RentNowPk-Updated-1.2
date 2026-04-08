'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, Navigation } from 'lucide-react'

export function HeroSearch() {
  const router = useRouter()
  const pickupRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLInputElement>(null)
  const acPickupRef = useRef<google.maps.places.Autocomplete | null>(null)
  const acDropRef = useRef<google.maps.places.Autocomplete | null>(null)

  const [pickupPlaceId, setPickupPlaceId] = useState('')
  const [dropoffPlaceId, setDropoffPlaceId] = useState('')
  const [radiusKm, setRadiusKm] = useState('50')
  const [mapsReady, setMapsReady] = useState(false)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()

  const attachAutocomplete = useCallback(() => {
    if (!apiKey || !pickupRef.current || !dropRef.current) return
    setOptions({ key: apiKey, v: 'weekly' })

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
        setMapsReady(true)
      })
      .catch(() => {})
  }, [apiKey])

  useEffect(() => {
    attachAutocomplete()
  }, [attachAutocomplete])

  const handleSearch = () => {
    if (!pickupPlaceId || !dropoffPlaceId) return
    const params = new URLSearchParams({
      pickupPlaceId,
      dropoffPlaceId,
      radiusKm: radiusKm || '50',
    })
    router.push(`/search?${params.toString()}`)
  }

  const canSearch = pickupPlaceId && dropoffPlaceId

  return (
    <div className="w-full max-w-[90vw] lg:max-w-6xl mx-auto">
      <div className="bg-white border-[5px] border-black p-5 md:p-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {/* Pickup */}
        <div className="flex-1 min-w-0 text-left px-3 py-2 border-b lg:border-b-0 lg:border-r border-gray-200 relative">
          <label className="block text-lg font-extrabold tracking-[0.15em] text-gray-500 mb-2">
            Pickup
          </label>
          <div className="flex items-center gap-2 border-2 border-gray-300 px-3 py-2 focus-within:border-primary transition-colors">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <Input
              ref={pickupRef}
              autoComplete="off"
              placeholder="City, airport, address"
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto font-semibold text-sm placeholder:text-gray-400 bg-transparent"
            />
          </div>
          <button
            type="button"
            className="mt-2.5 flex items-center gap-1.5 text-primary text-xs font-bold hover:opacity-80 transition-opacity bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full w-fit"
          >
            <Navigation className="h-3.5 w-3.5" />
            Use my current location
          </button>
        </div>

        {/* Destination */}
        <div className="flex-1 min-w-0 text-left px-3 py-2 border-b lg:border-b-0 lg:border-r border-gray-200">
          <label className="block text-xs font-bold uppercase tracking-[0.15em] text-gray-500 mb-2">
            Destination
          </label>
          <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl px-3 py-2 focus-within:border-primary transition-colors">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <Input
              ref={dropRef}
              autoComplete="off"
              placeholder="City, airport, address"
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto font-semibold text-sm placeholder:text-gray-400 bg-transparent"
            />
          </div>
        </div>

        {/* Radius */}
        <div className="flex-1 min-w-0 text-left px-3 py-2">
          <label className="block text-xs font-bold uppercase tracking-[0.15em] text-gray-500 mb-2">
            Radius
          </label>
          <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl px-3 py-2 focus-within:border-primary transition-colors">
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              className="w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto font-semibold text-sm text-gray-900 cursor-pointer appearance-none pr-6"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right center',
              }}
            >
              <option value="25">25 km</option>
              <option value="50">50 km</option>
              <option value="75">75 km</option>
              <option value="100">100 km</option>
            </select>
          </div>
        </div>

        {/* Search Button */}
        <Button
          type="button"
          className="bg-black text-white h-14 pl-10 pr-10 rounded-0 text-lg hover:bg-white cursor-pointer hover:text-black"
          disabled={!canSearch}
          onClick={handleSearch}
        >
          Search
        </Button>
      </div>

      {/* {!mapsReady && apiKey && (
        <p className="mt-3 text-center text-xs text-white/70">Loading maps…</p>
      )} */}
    </div>
  )
}
