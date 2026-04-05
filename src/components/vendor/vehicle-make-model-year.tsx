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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Make and model default to the NHTSA vPIC catalog (US). Use the toggle to type them
          yourself if needed.
        </p>
        <div className="flex items-center gap-2">
          <Checkbox
            id="vehicle-mmy-manual"
            checked={manualMode}
            onCheckedChange={(v) => onManualChange(v === true)}
          />
          <Label htmlFor="vehicle-mmy-manual" className="text-muted-foreground text-sm font-normal">
            Enter make &amp; model manually
          </Label>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field data-invalid={!!fieldErrors?.make}>
          <FieldLabel htmlFor={manualMode ? 'vehicle-make' : 'vehicle-make-combo'}>Make</FieldLabel>
          {manualMode ? (
            <div className="flex items-center gap-3">
              {makeLogoPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- external Logo.dev preview URL
                <img
                  src={makeLogoPreviewUrl}
                  alt=""
                  className="bg-muted size-10 shrink-0 rounded-full object-contain p-1 ring-1 ring-border"
                />
              ) : null}
              <Input
                id="vehicle-make"
                name="make"
                required
                value={makeStr}
                onChange={(e) => setMakeStr(e.target.value)}
                autoComplete="off"
                className="bg-card border-border min-w-0 flex-1"
                aria-invalid={!!fieldErrors?.make}
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
                    aria-expanded={makeOpen}
                    disabled={loadingMakes}
                    className={cn(
                      'border-border bg-card h-auto min-h-9 w-full justify-between rounded-4xl px-3 py-2 font-normal',
                      !makeStr && 'text-muted-foreground'
                    )}
                    aria-invalid={!!fieldErrors?.make}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {makeStr ? (
                        <>
                          {makeLogoPreviewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- Logo.dev preview
                            <img
                              src={makeLogoPreviewUrl}
                              alt=""
                              className="bg-muted size-8 shrink-0 rounded-full object-contain p-0.5 ring-1 ring-border"
                            />
                          ) : (
                            <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                              {initials(makeStr)}
                            </span>
                          )}
                          <span className="text-foreground truncate">{makeStr}</span>
                        </>
                      ) : (
                        <span>{loadingMakes ? 'Loading makes…' : 'Search make…'}</span>
                      )}
                    </span>
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      strokeWidth={2}
                      className="size-4 shrink-0 opacity-50"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search make…" />
                    <CommandList>
                      <CommandEmpty>No make found.</CommandEmpty>
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
                            >
                              {makeRowLogo ? (
                                // eslint-disable-next-line @next/next/no-img-element -- Logo.dev CDN
                                <img
                                  src={makeRowLogo}
                                  alt=""
                                  className="bg-muted size-8 shrink-0 rounded-full object-contain p-0.5 ring-1 ring-border"
                                />
                              ) : (
                                <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                                  {initials(m.name)}
                                </span>
                              )}
                              <span className="truncate">{m.name}</span>
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
          {fieldErrors?.make ? <FieldError>{fieldErrors.make}</FieldError> : null}
        </Field>

        <Field data-invalid={!!fieldErrors?.model}>
          <FieldLabel htmlFor={manualMode ? 'vehicle-model' : 'vehicle-model-combo'}>Model</FieldLabel>
          {manualMode ? (
            <Input
              id="vehicle-model"
              name="model"
              required
              value={modelStr}
              onChange={(e) => setModelStr(e.target.value)}
              autoComplete="off"
              className="bg-card border-border"
              aria-invalid={!!fieldErrors?.model}
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
                    aria-expanded={modelOpen}
                    disabled={modelDisabled}
                    className={cn(
                      'border-border bg-card h-auto min-h-9 w-full justify-between rounded-4xl px-3 py-2 font-normal',
                      !modelStr && 'text-muted-foreground'
                    )}
                    aria-invalid={!!fieldErrors?.model}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {modelStr ? (
                        <>
                          <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                            {initials(modelStr)}
                          </span>
                          <span className="text-foreground truncate">{modelStr}</span>
                        </>
                      ) : (
                        <span>
                          {selectedMakeId === null
                            ? 'Select a make first'
                            : loadingModels
                              ? 'Loading models…'
                              : 'Search model…'}
                        </span>
                      )}
                    </span>
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      strokeWidth={2}
                      className="size-4 shrink-0 opacity-50"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search model…" disabled={models.length === 0} />
                    <CommandList>
                      <CommandEmpty>
                        {selectedMakeId === null ? 'Select a make first.' : 'No model found.'}
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
                          >
                            <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                              {initials(m.name)}
                            </span>
                            <span className="truncate">{m.name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </>
          )}
          {fieldErrors?.model ? <FieldError>{fieldErrors.model}</FieldError> : null}
        </Field>
      </div>

      <Field data-invalid={!!fieldErrors?.year}>
        <FieldLabel htmlFor="vehicle-year-select">Year</FieldLabel>
        <input type="hidden" name="year" value={yearStr} />
        <Select value={yearStr} onValueChange={setYearStr}>
          <SelectTrigger
            id="vehicle-year-select"
            className="bg-card border-border w-full sm:max-w-48"
            aria-invalid={!!fieldErrors?.year}
          >
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {YEAR_OPTIONS.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors?.year ? <FieldError>{fieldErrors.year}</FieldError> : null}
      </Field>
    </>
  )
}
