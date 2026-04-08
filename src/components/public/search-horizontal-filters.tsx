'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User, Users } from 'lucide-react'

interface SearchHorizontalFiltersProps {
  cities: string[]
}

export function SearchHorizontalFilters({ cities }: SearchHorizontalFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const driveType = searchParams.get('driveType') || 'BOTH'
  const selectedCity = searchParams.get('cities') || ''

  const updateFilters = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'BOTH' && value !== 'ALL') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/search?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  return (
    <div className="flex flex-wrap items-center gap-4 py-4 px-1">
      
      {/* Drive Type Selector */}
      <div className="flex items-center p-1 bg-white border-2 border-[#0B1B3D] rounded-md shadow-[2px_2px_0_#0B1B3D]">
        <button
          onClick={() => updateFilters('driveType', 'BOTH')}
          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-tight rounded-sm transition-all ${
            driveType === 'BOTH' ? 'bg-[#F5A623] text-[#0B1B3D]' : 'text-[#0B1B3D]/60 hover:text-[#0B1B3D]'
          }`}
        >
          All Types
        </button>
        <button
          onClick={() => updateFilters('driveType', 'SELF_DRIVE')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-tight rounded-sm transition-all ${
            driveType === 'SELF_DRIVE' ? 'bg-[#F5A623] text-[#0B1B3D]' : 'text-[#0B1B3D]/60 hover:text-[#0B1B3D]'
          }`}
        >
          <User className="h-3 w-3" strokeWidth={3} />
          Self Drive
        </button>
        <button
          onClick={() => updateFilters('driveType', 'WITH_DRIVER')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-tight rounded-sm transition-all ${
            driveType === 'WITH_DRIVER' ? 'bg-[#F5A623] text-[#0B1B3D]' : 'text-[#0B1B3D]/60 hover:text-[#0B1B3D]'
          }`}
        >
          <Users className="h-3 w-3" strokeWidth={3} />
          With Driver
        </button>
      </div>

      {/* City Dropdown */}
      <div className="w-[180px]">
        <Select value={selectedCity || 'ALL'} onValueChange={(v) => updateFilters('cities', v)}>
          <SelectTrigger className="h-[42px] border-2 border-[#0B1B3D] bg-white text-[#0B1B3D] font-black uppercase text-[10px] tracking-tight shadow-[2px_2px_0_#0B1B3D] focus:ring-0">
             <SelectValue placeholder="Filter by City" />
          </SelectTrigger>
          <SelectContent className="border-2 border-[#0B1B3D] rounded-md shadow-[4px_4px_0_#0F1E32]">
            <SelectItem value="ALL" className="font-bold text-[#0B1B3D] text-[10px] uppercase">All Cities</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city} className="font-bold text-[#0B1B3D] text-[10px] uppercase">
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

    </div>
  )
}
