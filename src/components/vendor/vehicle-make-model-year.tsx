'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Field,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { showToast } from '@/components/ui/toast'
import { logoDevMakeImageUrl } from '@/lib/logo-dev/make-image-url'
import { cn } from '@/lib/utils'

type FieldKey = 'make' | 'model' | 'year'

type VpicMake = { id: number; name: string }
type VpicModel = { id: number; name: string }

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (
    parts[0]![0]! + parts[parts.length - 1]![0]!
  ).toUpperCase()
}

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_MIN = 1990
const YEAR_MAX = CURRENT_YEAR + 1

const YEAR_OPTIONS = Array.from(
  { length: YEAR_MAX - YEAR_MIN + 1 },
  (_, i) => String(YEAR_MAX - i)
)

type Props = {
  fieldErrors?: Partial<Record<FieldKey, string>>
  /** From server env so make logos work without NEXT_PUBLIC in the client bundle. */
  logoDevPublishableKey?: string
}

export function VehicleMakeModelYear({
  fieldErrors,
  logoDevPublishableKey,
}: Props) {
  const [manualMode, setManualMode] = useState(false)

  const [makeStr, setMakeStr] = useState('')
  const [modelStr, setModelStr] = useState('')
  const [yearStr, setYearStr] = useState(String(CURRENT_YEAR))

  const [makes, setMakes] = useState<VpicMake[]>([])
  const [models, setModels] = useState<VpicModel[]>([])
  const [selectedMakeId, setSelectedMakeId] = useState<number | null>(null)

  const [loadingMakes, setLoadingMakes] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)

  const [makeOpen, setMakeOpen] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)

  const [makeLogoPreviewUrl, setMakeLogoPreviewUrl] = useState<string | null>(null)

  const loadModelsForMake = useCallback(async (makeId: number) => {
    setLoadingModels(true)
    try {
      const res = await fetch(`/api/vpic/models?makeId=${makeId}`)
      const data = (await res.json()) as { models?: VpicModel[]; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Request failed')
      setModels(data.models ?? [])
    } catch {
      showToast('Could not load models for this make.', { type: 'error' })
      setModels([])
    } finally {
      setLoadingModels(false)
    }
  }, [])

  useEffect(() => {
    if (manualMode) return
    let cancelled = false
    ;(async () => {
      setLoadingMakes(true)
      try {
        const res = await fetch('/api/vpic/makes')
        const data = (await res.json()) as { makes?: VpicMake[]; error?: string }
        if (!res.ok) throw new Error(data.error ?? 'Request failed')
        if (!cancelled) setMakes(data.makes ?? [])
      } catch {
        if (!cancelled) {
          showToast('Could not load vehicle makes from NHTSA.', { type: 'error' })
        }
      } finally {
        if (!cancelled) setLoadingMakes(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [manualMode])

  useEffect(() => {
    const q = makeStr.trim()
    if (!q) {
      setMakeLogoPreviewUrl(null)
      return
    }
    const direct = logoDevMakeImageUrl(q, logoDevPublishableKey, 256)
    if (direct) {
      setMakeLogoPreviewUrl(direct)
      return
    }
    let cancelled = false
    const t = window.setTimeout(() => {
      fetch(`/api/brand-logo/url?make=${encodeURIComponent(q)}`)
        .then((r) => r.json() as Promise<{ url: string | null }>)
        .then((d) => {
          if (!cancelled) setMakeLogoPreviewUrl(d.url)
        })
        .catch(() => {
          if (!cancelled) setMakeLogoPreviewUrl(null)
        })
    }, 280)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [makeStr, logoDevPublishableKey])

  const modelDisabled = useMemo(() => {
    if (manualMode) return false
    return selectedMakeId === null || loadingModels
  }, [manualMode, selectedMakeId, loadingModels])

  const onManualChange = (next: boolean) => {
    setManualMode(next)
    if (next) {
      setSelectedMakeId(null)
      setModels([])
      setMakeOpen(false)
      setModelOpen(false)
    }
  }

  return (
    <>
      <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 bg-muted/20 p-4 border-l-4 border-primary">
        <p className="text-[11px] font-bold text-[#5c5c55] uppercase tracking-tight">
          Defaulting to NHTSA vPIC catalog. Toggle to enter manually if needed.
        </p>
        <div className="flex items-center gap-2">
          <Checkbox
            id="vehicle-mmy-manual"
            checked={manualMode}
            onCheckedChange={(v) => onManualChange(v === true)}
            className="h-4 w-4 border-2 border-primary rounded-none data-[state=checked]:bg-primary"
          />
          <label htmlFor="vehicle-mmy-manual" className="text-[11px] font-bold text-primary cursor-pointer uppercase tracking-widest">
            Manual entry
          </label>
        </div>
      </div>

      <div className="md:col-span-1">
        <Field
          label="Make"
          error={fieldErrors?.make}
          required
        >
          {manualMode ? (
            <div className="flex items-center gap-3 border-2 border-[#d4d4c8] bg-white focus-within:border-primary transition-all">
              {makeLogoPreviewUrl && (
                <img
                  src={makeLogoPreviewUrl}
                  alt=""
                  className="size-10 shrink-0 object-contain p-1 ml-2"
                />
              )}
              <Input
                id="vehicle-make"
                name="make"
                required
                value={makeStr}
                onChange={(e) => setMakeStr(e.target.value)}
                autoComplete="off"
                className="border-none h-14 font-bold text-sm bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none w-full"
              />
            </div>
          ) : (
            <>
              <input type="hidden" name="make" value={makeStr} />
              <Popover open={makeOpen} onOpenChange={setMakeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="vehicle-make-combo"
                    type="button"
                    variant="outline"
                    role="combobox"
                    disabled={loadingMakes}
                    className={cn(
                      'border-2 border-[#d4d4c8] bg-white h-14 w-full justify-between rounded-none px-4 font-bold text-sm hover:bg-white hover:border-primary transition-all',
                      !makeStr && 'text-[#5c5c55]'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      {makeStr ? (
                        <>
                          {makeLogoPreviewUrl ? (
                            <img
                              src={makeLogoPreviewUrl}
                              alt=""
                              className="size-8 shrink-0 object-contain"
                            />
                          ) : (
                            <span className="bg-muted text-primary flex size-8 shrink-0 items-center justify-center text-[10px] font-black uppercase">
                              {initials(makeStr)}
                            </span>
                          )}
                          <span className="truncate">{makeStr}</span>
                        </>
                      ) : (
                        <span>{loadingMakes ? 'Loading catalog…' : 'Select make…'}</span>
                      )}
                    </span>
                    <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 shrink-0 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-2 border-primary rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" align="start">
                  <Command className="rounded-none">
                    <CommandInput placeholder="Search catalog…" className="h-12 border-none focus:ring-0 rounded-none font-bold" />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty className="py-6 text-center text-xs font-bold uppercase text-[#5c5c55]">No results found.</CommandEmpty>
                      <CommandGroup>
                        {makes.map((m) => {
                          const makeRowLogo = logoDevMakeImageUrl(m.name, logoDevPublishableKey, 40)
                          return (
                            <CommandItem
                              key={m.id}
                              value={`${m.name} ${m.id}`}
                              onSelect={() => {
                                setMakeStr(m.name)
                                setSelectedMakeId(m.id)
                                setModelStr('')
                                setModels([])
                                void loadModelsForMake(m.id)
                                setMakeOpen(false)
                              }}
                              className="py-3 px-4 aria-selected:bg-primary aria-selected:text-white rounded-none cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                {makeRowLogo ? (
                                  <img
                                    src={makeRowLogo}
                                    alt=""
                                    className="size-8 shrink-0 object-contain bg-white p-0.5 border border-muted"
                                  />
                                ) : (
                                  <span className="bg-muted text-primary flex size-8 shrink-0 items-center justify-center text-[10px] font-black uppercase">
                                    {initials(m.name)}
                                  </span>
                                )}
                                <span className="font-bold text-sm">{m.name}</span>
                              </div>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </>
          )}
        </Field>
      </div>

      <div className="md:col-span-1">
        <Field
          label="Model"
          error={fieldErrors?.model}
          required
        >
          {manualMode ? (
            <Input
              id="vehicle-model"
              name="model"
              required
              value={modelStr}
              onChange={(e) => setModelStr(e.target.value)}
              autoComplete="off"
              className="bg-white border-2 border-[#d4d4c8] h-14 font-bold text-sm focus:border-primary transition-all rounded-none"
            />
          ) : (
            <>
              <input type="hidden" name="model" value={modelStr} />
              <Popover open={modelOpen} onOpenChange={setModelOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="vehicle-model-combo"
                    type="button"
                    variant="outline"
                    role="combobox"
                    disabled={modelDisabled}
                    className={cn(
                      'border-2 border-[#d4d4c8] bg-white h-14 w-full justify-between rounded-none px-4 font-bold text-sm hover:bg-white hover:border-primary transition-all',
                      !modelStr && 'text-[#5c5c55]'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      {modelStr ? (
                        <>
                          <span className="bg-muted text-primary flex size-8 shrink-0 items-center justify-center text-[10px] font-black uppercase">
                            {initials(modelStr)}
                          </span>
                          <span className="truncate">{modelStr}</span>
                        </>
                      ) : (
                        <span>
                          {selectedMakeId === null
                            ? 'Select make first'
                            : loadingModels
                              ? 'Loading models…'
                              : 'Select model…'}
                        </span>
                      )}
                    </span>
                    <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 shrink-0 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-2 border-primary rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" align="start">
                  <Command className="rounded-none">
                    <CommandInput placeholder="Search models…" disabled={models.length === 0} className="h-12 border-none focus:ring-0 rounded-none font-bold" />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty className="py-6 text-center text-xs font-bold uppercase text-[#5c5c55]">
                        {selectedMakeId === null ? 'Select make first.' : 'No models found.'}
                      </CommandEmpty>
                      <CommandGroup>
                        {models.map((m) => (
                          <CommandItem
                            key={m.id}
                            value={`${m.name} ${m.id}`}
                            onSelect={() => {
                              setModelStr(m.name)
                              setModelOpen(false)
                            }}
                            className="py-3 px-4 aria-selected:bg-primary aria-selected:text-white rounded-none cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className="bg-muted text-primary flex size-8 shrink-0 items-center justify-center text-[10px] font-black uppercase">
                                {initials(m.name)}
                              </span>
                              <span className="font-bold text-sm">{m.name}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </>
          )}
        </Field>
      </div>

      <div className="md:col-span-1">
        <Field label="Model year" error={fieldErrors?.year} required>
          <input type="hidden" name="year" value={yearStr} />
          <Select value={yearStr} onValueChange={setYearStr}>
            <SelectTrigger
              id="vehicle-year-select"
              className="bg-white border-2 border-[#d4d4c8] h-14 w-full font-bold text-sm focus:border-primary transition-all rounded-none"
            >
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={y} className="font-bold py-3 cursor-pointer focus:bg-primary focus:text-white rounded-none">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </>
  )
}
