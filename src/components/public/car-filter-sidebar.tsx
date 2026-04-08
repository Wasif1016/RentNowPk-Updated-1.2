'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Check, X, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterSidebarProps {
  metadata: {
    makes: string[]
    cities: string[]
    maxPrice: number
  }
}

export function CarFilterSidebar({ metadata }: FilterSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedMakes, setSelectedMakes] = useState<string[]>(
    searchParams.get('makes')?.split(',').filter(Boolean) || []
  )
  const [selectedCities, setSelectedCities] = useState<string[]>(
    searchParams.get('cities')?.split(',').filter(Boolean) || []
  )
  const [driveType, setDriveType] = useState<string>(
    searchParams.get('driveType') || 'BOTH'
  )

  const updateFilters = useCallback(
    (newMakes: string[], newCities: string[], newDrive: string) => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (newMakes.length > 0) params.set('makes', newMakes.join(','))
      else params.delete('makes')
      
      if (newCities.length > 0) params.set('cities', newCities.join(','))
      else params.delete('cities')
      
      if (newDrive !== 'BOTH') params.set('driveType', newDrive)
      else params.delete('driveType')

      // Reset offset on filter change
      params.delete('offset')
      
      router.push(`/Car?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  const toggleMake = (make: string) => {
    const next = selectedMakes.includes(make)
      ? selectedMakes.filter((m) => m !== make)
      : [...selectedMakes, make]
    setSelectedMakes(next)
    updateFilters(next, selectedCities, driveType)
  }

  const toggleCity = (city: string) => {
    const next = selectedCities.includes(city)
      ? selectedCities.filter((c) => c !== city)
      : [...selectedCities, city]
    setSelectedCities(next)
    updateFilters(selectedMakes, next, driveType)
  }

  const handleDriveType = (type: string) => {
    setDriveType(type)
    updateFilters(selectedMakes, selectedCities, type)
  }

  const clearAll = () => {
    setSelectedMakes([])
    setSelectedCities([])
    setDriveType('BOTH')
    router.push('/Car', { scroll: false })
  }

  const hasFilters = selectedMakes.length > 0 || selectedCities.length > 0 || driveType !== 'BOTH'

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-[#0B1B3D]">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-[#0B1B3D]" />
          <h2 className="font-black text-[#0B1B3D] uppercase tracking-wider text-lg">Filters</h2>
        </div>
        {hasFilters && (
          <button 
            onClick={clearAll}
            className="text-[11px] font-bold text-[#0B1B3D] hover:text-[#F5A623] uppercase tracking-tighter underline underline-offset-4"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Drive Type */}
      <div className="flex flex-col gap-4">
        <h3 className="font-black text-[#0B1B3D] uppercase tracking-tight text-sm">Drive Type</h3>
        <div className="flex flex-col gap-2">
          {['BOTH', 'SELF_DRIVE', 'WITH_DRIVER'].map((type) => (
            <button
              key={type}
              onClick={() => handleDriveType(type)}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-sm border-2 transition-all font-bold text-xs uppercase tracking-wide",
                driveType === type 
                  ? "bg-[#0B1B3D] border-[#0B1B3D] text-[#F5A623] shadow-[3px_3px_0_#F5A623]" 
                  : "bg-white border-[#0B1B3D] text-[#0B1B3D] hover:bg-gray-50"
              )}
            >
              {type.replace('_', ' ')}
              {driveType === type && <Check className="h-3 w-3" strokeWidth={4} />}
            </button>
          ))}
        </div>
      </div>

      {/* Location / City */}
      <div className="flex flex-col gap-4">
        <h3 className="font-black text-[#0B1B3D] uppercase tracking-tight text-sm">Location</h3>
        <div className="flex flex-wrap gap-2">
          {metadata.cities.map((city) => (
            <button
              key={city}
              onClick={() => toggleCity(city)}
              className={cn(
                "px-3 py-1.5 rounded-full border-2 text-[11px] font-black uppercase transition-all",
                selectedCities.includes(city)
                  ? "bg-[#F5A623] border-[#0B1B3D] text-[#0B1B3D]"
                  : "bg-white border-[#0B1B3D]/10 text-[#0B1B3D]/60 hover:border-[#0B1B3D] hover:text-[#0B1B3D]"
              )}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle Make */}
      <div className="flex flex-col gap-4">
        <h3 className="font-black text-[#0B1B3D] uppercase tracking-tight text-sm">Popular Makes</h3>
        <div className="grid grid-cols-1 gap-1.5">
          {metadata.makes.map((make) => (
            <label 
              key={make}
              className="group flex items-center justify-between cursor-pointer py-1"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-5 h-5 border-2 border-[#0B1B3D] rounded-sm flex items-center justify-center transition-all",
                  selectedMakes.includes(make) ? "bg-[#0B1B3D]" : "bg-white group-hover:bg-gray-50"
                )}>
                  {selectedMakes.includes(make) && <Check className="h-3 w-3 text-[#F5A623]" strokeWidth={4} />}
                </div>
                <span className={cn(
                  "text-sm font-bold uppercase tracking-tight",
                  selectedMakes.includes(make) ? "text-[#0B1B3D]" : "text-[#0B1B3D]/70"
                )}>{make}</span>
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={selectedMakes.includes(make)}
                onChange={() => toggleMake(make)}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
