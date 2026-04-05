'use client'

import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { GripVertical, ImagePlus, Loader2 } from 'lucide-react'
import {
  createVehicle,
  type CreateVehicleFieldKey,
  type CreateVehicleResult,
} from '@/lib/actions/vehicles'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
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
      className="relative flex max-w-2xl flex-col gap-8"
      encType="multipart/form-data"
      aria-busy={pending}
    >
      <input type="hidden" name="coverIndex" value={String(effectiveCoverIndex)} />

      {withDriver ? <input type="hidden" name="withDriverEnabled" value="on" /> : null}
      {selfDrive ? <input type="hidden" name="selfDriveEnabled" value="on" /> : null}

      {bannerError && !state?.fieldErrors ? (
        <p className="text-destructive text-sm" role="alert">
          {bannerError}
        </p>
      ) : null}

      <FieldGroup className="gap-6">
        <Field data-invalid={!!fieldError(fe, 'name')}>
          <FieldLabel htmlFor="vehicle-name">Vehicle name</FieldLabel>
          <Input
            id="vehicle-name"
            name="name"
            required
            autoComplete="off"
            placeholder="e.g. Toyota Corolla"
            className="bg-card border-border"
            aria-invalid={!!fieldError(fe, 'name')}
          />
          {fieldError(fe, 'name') ? (
            <FieldError>{fieldError(fe, 'name')}</FieldError>
          ) : null}
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
      </FieldGroup>

      <VehiclePickupMap
        fieldError={
          fieldError(fe, 'pickup') ??
          fieldError(fe, 'pickupLatitude') ??
          fieldError(fe, 'pickupLongitude')
        }
      />

      <div className="border-border space-y-4 rounded-xl border bg-card p-4">
        <p className="text-foreground text-sm font-medium">Drive types & pricing</p>
        <FieldDescription>
          Enable at least one option and enter day and month prices (PKR) for each enabled type.
        </FieldDescription>

        {(fieldError(fe, 'withDriverEnabled') || fieldError(fe, 'selfDriveEnabled')) && (
          <p className="text-destructive text-sm">
            {fieldError(fe, 'withDriverEnabled') ?? fieldError(fe, 'selfDriveEnabled')}
          </p>
        )}

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="with-driver"
              checked={withDriver}
              onCheckedChange={(v) => setWithDriver(v === true)}
            />
            <div className="grid flex-1 gap-3">
              <Label htmlFor="with-driver" className="text-foreground font-normal">
                With driver
              </Label>
              {withDriver ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field data-invalid={!!fieldError(fe, 'priceWithDriverDay')}>
                    <FieldLabel htmlFor="pwd-day">Price / day</FieldLabel>
                    <Input
                      id="pwd-day"
                      name="priceWithDriverDay"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      className="bg-background border-border"
                      aria-invalid={!!fieldError(fe, 'priceWithDriverDay')}
                    />
                    {fieldError(fe, 'priceWithDriverDay') ? (
                      <FieldError>{fieldError(fe, 'priceWithDriverDay')}</FieldError>
                    ) : null}
                  </Field>
                  <Field data-invalid={!!fieldError(fe, 'priceWithDriverMonth')}>
                    <FieldLabel htmlFor="pwd-month">Price / month</FieldLabel>
                    <Input
                      id="pwd-month"
                      name="priceWithDriverMonth"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      className="bg-background border-border"
                      aria-invalid={!!fieldError(fe, 'priceWithDriverMonth')}
                    />
                    {fieldError(fe, 'priceWithDriverMonth') ? (
                      <FieldError>{fieldError(fe, 'priceWithDriverMonth')}</FieldError>
                    ) : null}
                  </Field>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="self-drive"
              checked={selfDrive}
              onCheckedChange={(v) => setSelfDrive(v === true)}
            />
            <div className="grid flex-1 gap-3">
              <Label htmlFor="self-drive" className="text-foreground font-normal">
                Self drive
              </Label>
              {selfDrive ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field data-invalid={!!fieldError(fe, 'priceSelfDriveDay')}>
                    <FieldLabel htmlFor="psd-day">Price / day</FieldLabel>
                    <Input
                      id="psd-day"
                      name="priceSelfDriveDay"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      className="bg-background border-border"
                      aria-invalid={!!fieldError(fe, 'priceSelfDriveDay')}
                    />
                    {fieldError(fe, 'priceSelfDriveDay') ? (
                      <FieldError>{fieldError(fe, 'priceSelfDriveDay')}</FieldError>
                    ) : null}
                  </Field>
                  <Field data-invalid={!!fieldError(fe, 'priceSelfDriveMonth')}>
                    <FieldLabel htmlFor="psd-month">Price / month</FieldLabel>
                    <Input
                      id="psd-month"
                      name="priceSelfDriveMonth"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      className="bg-background border-border"
                      aria-invalid={!!fieldError(fe, 'priceSelfDriveMonth')}
                    />
                    {fieldError(fe, 'priceSelfDriveMonth') ? (
                      <FieldError>{fieldError(fe, 'priceSelfDriveMonth')}</FieldError>
                    ) : null}
                  </Field>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Field data-invalid={!!fieldError(fe, 'images')}>
        <FieldLabel>Photos</FieldLabel>
        <FieldDescription>
          Up to {MAX_FILES} images. The <strong>cover</strong> photo is the one marked below — drag
          tiles to reorder; the cover is used on listings.
        </FieldDescription>

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
            'border-border bg-muted/30 hover:bg-muted/50 mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-10 transition-colors',
            fieldError(fe, 'images') && 'border-destructive'
          )}
        >
          <ImagePlus className="text-muted-foreground size-10" strokeWidth={1.25} />
          <div className="text-center">
            <p className="text-foreground text-sm font-medium">Add photos</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Click or drop files here · JPEG, PNG, WebP · max {MAX_FILES} files
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" className="pointer-events-none mt-1">
            Browse files
          </Button>
        </div>

        {fieldError(fe, 'images') ? (
          <FieldError className="mt-2">{fieldError(fe, 'images')}</FieldError>
        ) : null}

        {fileList.length > 0 ? (
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
                    'border-border bg-card relative aspect-4/3 overflow-hidden rounded-xl border shadow-sm transition-shadow',
                    effectiveCoverIndex === i && 'ring-primary ring-2 ring-offset-2 ring-offset-background'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- blob previews */}
                  <img
                    src={previewUrls[i]}
                    alt=""
                    className="size-full object-cover"
                  />
                  <div className="absolute top-1 left-1 flex items-center gap-0.5 rounded-md bg-black/55 px-1 py-0.5 text-white backdrop-blur-sm">
                    <GripVertical className="size-3.5 shrink-0 opacity-90" aria-hidden />
                    <span className="text-[10px] font-medium">{i + 1}</span>
                  </div>
                  {effectiveCoverIndex === i ? (
                    <span className="bg-primary text-primary-foreground absolute bottom-1 right-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold">
                      Cover
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="hover:bg-destructive/15 absolute top-1 right-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFileList((prev) => {
                        const next = prev.filter((_, j) => j !== i)
                        return next
                      })
                      setCoverIndex((ci) => {
                        if (ci === i) return 0
                        if (ci > i) return ci - 1
                        return ci
                      })
                    }}
                  >
                    Remove
                  </button>
                </div>
                <Button
                  type="button"
                  variant={effectiveCoverIndex === i ? 'default' : 'outline'}
                  size="sm"
                  className="mt-2 h-8 w-full text-xs"
                  onClick={() => setCoverIndex(i)}
                >
                  {effectiveCoverIndex === i ? 'Cover photo' : 'Set as cover'}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        {fieldError(fe, 'coverIndex') ? (
          <FieldError className="mt-2">{fieldError(fe, 'coverIndex')}</FieldError>
        ) : null}
      </Field>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? 'Saving…' : 'Save vehicle'}
      </Button>
    </form>

    {pending ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 backdrop-blur-[1px]"
        role="status"
        aria-live="polite"
        aria-label="Saving vehicle"
      >
        <div className="border-border bg-card flex flex-col items-center gap-3 rounded-2xl border px-8 py-6 shadow-xl">
          <Loader2 className="text-primary size-9 animate-spin" aria-hidden />
          <p className="text-foreground text-sm font-medium">Saving vehicle…</p>
          <p className="text-muted-foreground max-w-xs text-center text-xs">
            Uploading photos and creating your listing. Please wait.
          </p>
        </div>
      </div>
    ) : null}
    </>
  )
}
