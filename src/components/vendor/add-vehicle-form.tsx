'use client'

import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { GripVertical, ImagePlus, Loader2, X, Car, MapPin, DollarSign } from 'lucide-react'
import {
  createVehicle,
  type CreateVehicleFieldKey,
  type CreateVehicleResult,
} from '@/lib/actions/vehicles'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { showToast } from '@/components/ui/toast'
import { VehicleMakeModelYear } from '@/components/vendor/vehicle-make-model-year'
import { VehiclePickupMap } from '@/components/vendor/vehicle-pickup-map'

const MAX_BYTES = 8 * 1024 * 1024
const MAX_FILES = 5
const ACCEPT = 'image/jpeg,image/png,image/webp'

function validateFile(f: File): string | null {
  if (f.size > MAX_BYTES) return 'Each image must be 8 MB or smaller.'
  if (!ACCEPT.split(',').includes(f.type)) return 'Use JPEG, PNG, or WebP.'
  return null
}

function reorderFiles<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return [...list]
  const next = [...list]
  const [removed] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, removed)
  return next
}

async function createVehicleFormAction(
  prev: CreateVehicleResult | null,
  formData: FormData
): Promise<CreateVehicleResult | null> {
  return (await createVehicle(prev, formData)) ?? null
}

function fieldError(
  fe: Partial<Record<CreateVehicleFieldKey, string>> | undefined,
  key: CreateVehicleFieldKey
): string | undefined {
  return fe?.[key]
}

type AddVehicleFormProps = {
  logoDevPublishableKey?: string
}

export function AddVehicleForm({ logoDevPublishableKey }: AddVehicleFormProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(createVehicleFormAction, null)

  const [withDriver, setWithDriver] = useState(true)
  const [selfDrive, setSelfDrive] = useState(true)

  const [fileList, setFileList] = useState<File[]>([])
  const [coverIndex, setCoverIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragFrom = useRef<number | null>(null)

  const previewUrls = useMemo(
    () => fileList.map((f) => URL.createObjectURL(f)),
    [fileList]
  )

  useEffect(() => {
    return () => {
      for (const u of previewUrls) {
        URL.revokeObjectURL(u)
      }
    }
  }, [previewUrls])

  const effectiveCoverIndex =
    fileList.length === 0 ? 0 : Math.min(coverIndex, fileList.length - 1)

  const mergeIncomingFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming)
    setFileList((prev) => {
      const next = [...prev]
      for (const f of arr) {
        if (next.length >= MAX_FILES) {
          showToast(`You can add at most ${MAX_FILES} photos.`, { type: 'error' })
          break
        }
        const err = validateFile(f)
        if (err) {
          showToast(err, { type: 'error' })
          continue
        }
        next.push(f)
      }
      return next
    })
  }

  useEffect(() => {
    setCoverIndex((ci) => Math.min(ci, Math.max(0, fileList.length - 1)))
  }, [fileList.length])

  const onFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files
    if (!list?.length) return
    mergeIncomingFiles(list)
    e.target.value = ''
  }

  const onDropZoneDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = e.dataTransfer.files
    if (files?.length) mergeIncomingFiles(files)
  }

  const onReorderDrop = (toIndex: number) => {
    const from = dragFrom.current
    dragFrom.current = null
    if (from === null || from === toIndex) return
    setFileList((prev) => {
      const next = reorderFiles(prev, from, toIndex)
      setCoverIndex((ci) => {
        const coverFile = prev[ci]
        const ni = next.findIndex((f) => f === coverFile)
        return ni >= 0 ? ni : 0
      })
      return next
    })
  }

  const fe = state?.ok === false ? state.fieldErrors : undefined
  const bannerError = state?.ok === false ? state.message : null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (fileList.length === 0) {
      showToast('Add at least one photo.', { type: 'error' })
      return
    }
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.delete('images')
    for (const f of fileList) {
      fd.append('images', f)
    }
    startTransition(() => {
      void formAction(fd)
    })
  }

  return (
    <>
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl space-y-6"
      encType="multipart/form-data"
      aria-busy={pending}
    >
      <input type="hidden" name="coverIndex" value={String(effectiveCoverIndex)} />
      {withDriver ? <input type="hidden" name="withDriverEnabled" value="on" /> : null}
      {selfDrive ? <input type="hidden" name="selfDriveEnabled" value="on" /> : null}

      {bannerError && !state?.fieldErrors && (
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
          <p className="text-sm text-destructive">{bannerError}</p>
        </div>
      )}

      {/* Vehicle Details */}
      <SectionCard icon={Car} title="Vehicle details" description="Basic information about your vehicle.">
        <div className="space-y-4">
          <Field
            label="Vehicle name"
            error={fieldError(fe, 'name')}
            description="e.g. Toyota Corolla 2024"
          >
            <Input
              id="vehicle-name"
              name="name"
              required
              autoComplete="off"
              placeholder="e.g. Toyota Corolla"
              className={cn('bg-muted/50 border-border/50 focus:bg-background', fieldError(fe, 'name') && 'border-destructive')}
              aria-invalid={!!fieldError(fe, 'name')}
            />
          </Field>

          <VehicleMakeModelYear
            logoDevPublishableKey={logoDevPublishableKey}
            fieldErrors={
              fe
                ? {
                    make: fieldError(fe, 'make'),
                    model: fieldError(fe, 'model'),
                    year: fieldError(fe, 'year'),
                  }
                : undefined
            }
          />
        </div>
      </SectionCard>

      {/* Pickup Location */}
      <SectionCard icon={MapPin} title="Pickup location" description="Where customers will pick up the vehicle.">
        <VehiclePickupMap
          fieldError={
            fieldError(fe, 'pickup') ??
            fieldError(fe, 'pickupLatitude') ??
            fieldError(fe, 'pickupLongitude')
          }
        />
      </SectionCard>

      {/* Drive Types & Pricing */}
      <SectionCard icon={DollarSign} title="Drive types & pricing" description="Enable at least one option and set prices in PKR.">
        <div className="space-y-4">
          {(fieldError(fe, 'withDriverEnabled') || fieldError(fe, 'selfDriveEnabled')) && (
            <p className="text-sm text-destructive">
              {fieldError(fe, 'withDriverEnabled') ?? fieldError(fe, 'selfDriveEnabled')}
            </p>
          )}

          <DriveTypeSection
            id="with-driver"
            label="With driver"
            checked={withDriver}
            onCheckedChange={(v) => setWithDriver(v === true)}
            dayError={fieldError(fe, 'priceWithDriverDay')}
            monthError={fieldError(fe, 'priceWithDriverMonth')}
            dayName="priceWithDriverDay"
            monthName="priceWithDriverMonth"
            dayId="pwd-day"
            monthId="pwd-month"
          />

          <DriveTypeSection
            id="self-drive"
            label="Self drive"
            checked={selfDrive}
            onCheckedChange={(v) => setSelfDrive(v === true)}
            dayError={fieldError(fe, 'priceSelfDriveDay')}
            monthError={fieldError(fe, 'priceSelfDriveMonth')}
            dayName="priceSelfDriveDay"
            monthName="priceSelfDriveMonth"
            dayId="psd-day"
            monthId="psd-month"
          />
        </div>
      </SectionCard>

      {/* Photos */}
      <SectionCard icon={ImagePlus} title="Photos" description={`Up to ${MAX_FILES} images. Drag to reorder. The cover photo appears on listings.`}>
        <input
          ref={fileInputRef}
          id="vehicle-images"
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={onFilesChange}
          aria-hidden
        />

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              fileInputRef.current?.click()
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onDrop={onDropZoneDrop}
          className={cn(
            'border-border bg-muted/30 hover:bg-muted/50 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition-colors',
            fieldError(fe, 'images') && 'border-destructive'
          )}
        >
          <ImagePlus className="text-muted-foreground size-8" strokeWidth={1.25} />
          <div className="text-center">
            <p className="text-foreground text-sm font-medium">Add photos</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Click or drop · JPEG, PNG, WebP · max {MAX_FILES}
            </p>
          </div>
        </div>

        {fieldError(fe, 'images') && (
          <p className="text-xs text-destructive mt-1">{fieldError(fe, 'images')}</p>
        )}

        {fileList.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {fileList.map((file, i) => (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}-${i}`}
                draggable
                onDragStart={(e) => {
                  dragFrom.current = i
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/plain', String(i))
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  onReorderDrop(i)
                }}
                className="group relative"
              >
                <div
                  className={cn(
                    'border-border bg-card relative aspect-4/3 overflow-hidden rounded-xl border shadow-sm transition-all',
                    effectiveCoverIndex === i && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- blob previews */}
                  <img
                    src={previewUrls[i]}
                    alt=""
                    className="size-full object-cover"
                  />
                  <div className="absolute top-1 left-1 flex items-center gap-0.5 rounded-md bg-black/55 px-1.5 py-0.5 text-white backdrop-blur-sm">
                    <GripVertical className="size-3 shrink-0 opacity-90" aria-hidden />
                    <span className="text-[10px] font-medium">{i + 1}</span>
                  </div>
                  {effectiveCoverIndex === i && (
                    <span className="bg-primary text-primary-foreground absolute bottom-1 right-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    className="absolute top-1 right-1 rounded-md bg-black/50 p-1 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFileList((prev) => prev.filter((_, j) => j !== i))
                      setCoverIndex((ci) => {
                        if (ci === i) return 0
                        if (ci > i) return ci - 1
                        return ci
                      })
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <Button
                  type="button"
                  variant={effectiveCoverIndex === i ? 'default' : 'outline'}
                  size="sm"
                  className="mt-1.5 h-7 w-full text-[11px]"
                  onClick={() => setCoverIndex(i)}
                >
                  {effectiveCoverIndex === i ? 'Cover photo' : 'Set as cover'}
                </Button>
              </li>
            ))}
          </ul>
        )}

        {fieldError(fe, 'coverIndex') && (
          <p className="text-xs text-destructive mt-1">{fieldError(fe, 'coverIndex')}</p>
        )}
      </SectionCard>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={pending} size="lg" className="rounded-xl px-8">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            'Save vehicle'
          )}
        </Button>
      </div>
    </form>

    {pending && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        role="status"
        aria-live="polite"
        aria-label="Saving vehicle"
      >
        <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border border-border px-8 py-6 shadow-xl">
          <Loader2 className="text-primary size-8 animate-spin" aria-hidden />
          <p className="text-foreground text-sm font-medium">Saving vehicle…</p>
          <p className="text-muted-foreground max-w-xs text-center text-xs">
            Uploading photos and creating your listing.
          </p>
        </div>
      </div>
    )}
    </>
  )
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl bg-card border border-border shadow-sm p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  error,
  description,
  children,
}: {
  label: string
  error?: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      {description && !error && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  )
}

function DriveTypeSection({
  id,
  label,
  checked,
  onCheckedChange,
  dayError,
  monthError,
  dayName,
  monthName,
  dayId,
  monthId,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  dayError?: string
  monthError?: string
  dayName: string
  monthName: string
  dayId: string
  monthId: string
}) {
  return (
    <div className="rounded-lg border border-border/50 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Checkbox id={id} checked={checked} onCheckedChange={(v) => onCheckedChange(v === true)} />
        <Label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer">
          {label}
        </Label>
      </div>

      {checked && (
        <div className="grid gap-3 sm:grid-cols-2 pl-7">
          <Field label="Price / day" error={dayError}>
            <Input
              id={dayId}
              name={dayName}
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              placeholder="0.00"
              className={cn('bg-muted/50 border-border/50 focus:bg-background', dayError && 'border-destructive')}
              aria-invalid={!!dayError}
            />
          </Field>
          <Field label="Price / month" error={monthError}>
            <Input
              id={monthId}
              name={monthName}
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              placeholder="0.00"
              className={cn('bg-muted/50 border-border/50 focus:bg-background', monthError && 'border-destructive')}
              aria-invalid={!!monthError}
            />
          </Field>
        </div>
      )}
    </div>
  )
}
