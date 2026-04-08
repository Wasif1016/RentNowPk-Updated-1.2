'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { MapPin, ArrowRight, Navigation } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface HeroSearchCardProps {
  initialPickupPlaceId?: string
  initialDropoffPlaceId?: string
  initialRadiusKm?: string
  initialPickupAddress?: string
  initialDropoffAddress?: string
}

export function HeroSearchCard({
  initialPickupPlaceId = '',
  initialDropoffPlaceId = '',
  initialRadiusKm = '50',
  initialPickupAddress = '',
  initialDropoffAddress = ''
}: HeroSearchCardProps) {
  const router = useRouter()
  const pickupRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLInputElement>(null)
  const acPickupRef = useRef<google.maps.places.Autocomplete | null>(null)
  const acDropRef = useRef<google.maps.places.Autocomplete | null>(null)

  const [pickupPlaceId, setPickupPlaceId] = useState(initialPickupPlaceId)
  const [dropoffPlaceId, setDropoffPlaceId] = useState(initialDropoffPlaceId)
  const [radiusKm, setRadiusKm] = useState(initialRadiusKm)
  const [mapsReady, setMapsReady] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  // Initialize input values if addresses are provided
  useEffect(() => {
    if (pickupRef.current && initialPickupAddress) {
      pickupRef.current.value = initialPickupAddress
    }
    if (dropRef.current && initialDropoffAddress) {
      dropRef.current.value = initialDropoffAddress
    }
  }, [initialPickupAddress, initialDropoffAddress])

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
      .catch(() => { })
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

  const handleCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const geocoding = await importLibrary('geocoding') as google.maps.GeocodingLibrary
          const geocoder = new geocoding.Geocoder()
          geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const place = results[0]
              if (pickupRef.current) {
                pickupRef.current.value = place.formatted_address || ''
              }
              setPickupPlaceId(place.place_id || '')
            } else {
              alert('Could not resolve your location.')
            }
            setIsLocating(false)
          })
        } catch (e) {
          console.error('Geocoding error:', e)
          setIsLocating(false)
        }
      },
      (err) => {
        console.error(err)
        alert('Location access denied or failed.')
        setIsLocating(false)
      }
    )
  }

  const canSearch = pickupPlaceId && dropoffPlaceId

  return (
    <div className="w-full max-w-[1300px] mx-auto px-4 md:px-0 mt-8 mb-4">
      <div className="bg-white border-2 border-[#0B1B3D] rounded-md p-4 md:p-5 shadow-[6px_6px_0_#0F1E32] relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">

          {/* Pickup */}
          <div className="lg:col-span-4 flex flex-col gap-1.5 relative">
            <label className="text-[10px] md:text-[11px] font-bold text-[#0B1B3D] tracking-wider uppercase ml-1">
              Pickup Location
            </label>
            <div
              className="flex items-center gap-2 border-[1.5px] border-[#0B1B3D] rounded-md bg-white px-3 h-[48px] focus-within:ring-1 focus-within:ring-[#0B1B3D] cursor-text"
              onClick={() => pickupRef.current?.focus()}
            >
              <MapPin className="h-[18px] w-[18px] text-[#0B1B3D] shrink-0" strokeWidth={2.5} />
              <input
                ref={pickupRef}
                type="text"
                placeholder="Search pickup..."
                className="flex-1 w-full bg-transparent border-none outline-none text-[#0B1B3D] font-bold text-[14px] placeholder:text-gray-400 placeholder:font-medium"
              />
            </div>
            {/* Auto Detect Location Button */}
            <button
              type="button"
              onClick={handleCurrentLocation}
              disabled={isLocating}
              className="mt-1 flex w-fit items-center gap-1.5 text-[#0B1B3D] text-[10px] sm:text-[11px] font-bold tracking-wider uppercase hover:text-[#F5A623] cursor-pointer transition-colors ml-1 disabled:opacity-50"
            >
              <Navigation className="h-[12px] w-[12px]" strokeWidth={3} />
              {isLocating ? 'Locating...' : 'Use Current Location'}
            </button>
          </div>

          {/* Destination */}
          <div className="lg:col-span-4 flex flex-col gap-1.5">
            <label className="text-[10px] md:text-[11px] font-bold text-[#0B1B3D] tracking-wider uppercase ml-1">
              Destination
            </label>
            <div
              className="flex items-center gap-2 border-[1.5px] border-[#0B1B3D] rounded-md bg-white px-3 h-[48px] focus-within:ring-1 focus-within:ring-[#0B1B3D] cursor-text"
              onClick={() => dropRef.current?.focus()}
            >
              <MapPin className="h-[18px] w-[18px] text-[#0B1B3D] shrink-0" strokeWidth={2.5} />
              <input
                ref={dropRef}
                type="text"
                placeholder="Search destination..."
                className="flex-1 w-full bg-transparent border-none outline-none text-[#0B1B3D] font-bold text-[14px] placeholder:text-gray-400 placeholder:font-medium"
              />
            </div>
          </div>

          {/* Radius */}
          <div className="lg:col-span-2 flex flex-col mt-2 gap-1.5">
            <label className="text-[10px] md:text-[11px] font-bold text-[#0B1B3D] tracking-wider uppercase ml-1">
              Search Radius
            </label>
            <Select value={radiusKm} onValueChange={setRadiusKm}>
              <SelectTrigger className="w-full border-[1.5px] border-[#0B1B3D] rounded-md bg-white px-3 h-[48px] text-[#0B1B3D] font-bold text-[14px] shadow-none focus:ring-[#0B1B3D] focus:ring-1 hover:bg-gray-50 cursor-pointer transition-colors">
                <SelectValue placeholder="Select Radius" />
              </SelectTrigger>
              <SelectContent className="border-2 border-[#0B1B3D] rounded-md shadow-[4px_4px_0_#0F1E32]">
                <SelectItem value="25" className="font-bold text-[#0B1B3D] cursor-pointer">Within 25 km</SelectItem>
                <SelectItem value="50" className="font-bold text-[#0B1B3D] cursor-pointer">Within 50 km</SelectItem>
                <SelectItem value="75" className="font-bold text-[#0B1B3D] cursor-pointer">Within 75 km</SelectItem>
                <SelectItem value="100" className="font-bold text-[#0B1B3D] cursor-pointer">Within 100 km</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Button */}
          <div className="lg:col-span-2 flex flex-col justify-start pb-1">
            {/* The label placeholder forces alignment with other fields */}
            <label className="text-[10px] md:text-[11px] font-bold tracking-wider uppercase ml-1 invisible mb-1.5 hidden lg:block">
              Submit
            </label>
            <button
              onClick={handleSearch}
              disabled={!canSearch}
              className="w-full h-[48px] px-2 lg:px-4 xl:px-6 bg-[#F5A623] hover:bg-[#E59A1F] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#0B1B3D] rounded-md text-[#0B1B3D] font-black uppercase text-[14px] sm:text-[15px] whitespace-nowrap flex items-center justify-center gap-2 shadow-[3px_3px_0_#0F1E32] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[1px_1px_0_#0F1E32] transition-all"
            >
              Find Cars <ArrowRight className="h-5 w-5 shrink-0" strokeWidth={3} />
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
