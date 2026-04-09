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
import { GripVertical, ImagePlus, Loader2, X, Car, MapPin, DollarSign, CheckCircle, Info } from 'lucide-react'
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
    <div className="font-sans" style={{ fontFamily: 'Arial, sans-serif' }}>
      <form
        onSubmit={handleSubmit}
        className="space-y-12"
        encType="multipart/form-data"
        aria-busy={pending}
      >
        <input type="hidden" name="coverIndex" value={String(effectiveCoverIndex)} />
        {withDriver ? <input type="hidden" name="withDriverEnabled" value="on" /> : null}
        {selfDrive ? <input type="hidden" name="selfDriveEnabled" value="on" /> : null}

        {bannerError && !state?.fieldErrors && (
          <div className="bg-[#ffdad6] border-2 border-[#ba1a1a] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-top-4">
            <p className="text-xs font-bold text-[#ba1a1a] uppercase tracking-widest">{bannerError}</p>
          </div>
        )}

        {/* Section 1: Vehicle Details */}
        <section className="form-section">
          <h2 className="text-[20px] font-bold text-primary mb-8 pb-3 border-b-2 border-primary">Vehicle details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <Field
                label="Vehicle display name"
                error={fieldError(fe, 'name')}
                hint="How your vehicle appears in search"
                required
              >
                <Input
                  id="vehicle-name"
                  name="name"
                  required
                  autoComplete="off"
                  placeholder="e.g., Toyota Corolla Altis"
                  className={cn(
                    'field-input bg-white h-14 text-sm font-bold border-2 border-[#d4d4c8] focus:border-primary transition-all rounded-none',
                    fieldError(fe, 'name') && 'border-red-600'
                  )}
                />
              </Field>
            </div>

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
        </section>

        {/* Section 2: Location & Availability */}
        <section className="form-section">
          <h2 className="text-[20px] font-bold text-primary mb-8 pb-3 border-b-2 border-primary">Location & availability</h2>
          <div className="space-y-6">
            <VehiclePickupMap
              fieldError={
                fieldError(fe, 'pickup') ??
                fieldError(fe, 'pickupLatitude') ??
                fieldError(fe, 'pickupLongitude')
              }
            />
          </div>
        </section>

        {/* Section 3: Pricing */}
        <section className="form-section">
          <h2 className="text-[20px] font-bold text-primary mb-8 pb-3 border-b-2 border-primary">Pricing</h2>
          <div className="space-y-10">
            {(fieldError(fe, 'withDriverEnabled') || fieldError(fe, 'selfDriveEnabled')) && (
              <p className="text-xs font-bold text-red-600 border-2 border-red-600 p-3 bg-red-50">
                {fieldError(fe, 'withDriverEnabled') ?? fieldError(fe, 'selfDriveEnabled')}
              </p>
            )}

            <div className="grid grid-cols-1 gap-12">
              <DriveTypePriceRow
                id="with-driver"
                label="With Chauffeur (Daily Rate)"
                checked={withDriver}
                onCheckedChange={(v) => setWithDriver(v === true)}
                dayError={fieldError(fe, 'priceWithDriverDay')}
                dayName="priceWithDriverDay"
                dayId="pwd-day"
              />

              <DriveTypePriceRow
                id="self-drive"
                label="Self Drive Only (Daily Rate)"
                checked={selfDrive}
                onCheckedChange={(v) => setSelfDrive(v === true)}
                dayError={fieldError(fe, 'priceSelfDriveDay')}
                dayName="priceSelfDriveDay"
                dayId="psd-day"
              />
            </div>
          </div>
        </section>

        {/* Section 4: Vehicle Photos */}
        <section className="form-section">
          <h2 className="text-[20px] font-bold text-primary mb-8 pb-3 border-b-2 border-primary">Vehicle photos</h2>
          
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
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onDrop={onDropZoneDrop}
            className={cn(
              'border-2 border-dashed border-[#d4d4c8] bg-[#fafaf8] py-12 px-6 text-center cursor-pointer transition-all hover:border-primary',
              fieldError(fe, 'images') && 'border-red-600'
            )}
          >
            <div className="text-4xl text-[#5c5c55] mb-3">[+]</div>
            <p className="text-sm font-bold text-primary mb-1">Click to upload or drag and drop</p>
            <p className="text-xs text-[#5c5c55]">JPG, PNG or WebP (max 5MB each)</p>
          </div>

          {fieldError(fe, 'images') && (
            <p className="text-xs font-bold text-red-600 mt-4 border-2 border-red-600 p-3 bg-red-50">{fieldError(fe, 'images')}</p>
          )}

          {fileList.length > 0 && (
            <div className="mt-8">
               <p className="text-[11px] font-bold text-[#5c5c55] uppercase tracking-widest mb-4">Current Portfolio (Drag to reorder)</p>
               <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {fileList.map((file, i) => (
                  <li
                    key={`${file.name}-${file.size}-${file.lastModified}-${i}`}
                    draggable
                    onDragStart={(e) => {
                      dragFrom.current = i
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      onReorderDrop(i)
                    }}
                    className="relative group h-full"
                  >
                    <div
                      className={cn(
                        'relative aspect-square overflow-hidden border-2 border-[#d4d4c8] transition-all',
                        effectiveCoverIndex === i ? 'border-primary ring-2 ring-primary ring-offset-2' : ''
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- blob previews */}
                      <img
                        src={previewUrls[i]}
                        alt=""
                        className="size-full object-cover"
                      />
                      
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-white border-2 border-black p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          setFileList((prev) => prev.filter((_, j) => j !== i))
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>

                      {effectiveCoverIndex === i && (
                         <div className="absolute inset-x-0 bottom-0 bg-primary py-1 text-[9px] font-bold text-white text-center uppercase tracking-widest">
                            Cover Asset
                         </div>
                      )}
                    </div>
                    
                    {effectiveCoverIndex !== i && (
                      <button
                        type="button"
                        className="mt-2 w-full text-[9px] font-bold uppercase tracking-widest text-[#5c5c55] hover:text-black transition-colors"
                        onClick={() => setCoverIndex(i)}
                      >
                        Set as cover
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[12px] text-[#5c5c55] mt-6">
            First image will be used as the cover photo in search results.
          </p>
        </section>

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-10 border-t-2 border-[#d4d4c8] mt-8">
           <Button 
            type="button" 
            variant="ghost" 
            onClick={() => router.back()}
            className="bg-transparent text-primary hover:bg-muted font-bold text-[15px] h-auto px-8 py-4 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none"
           >
            Cancel
           </Button>
           <Button 
             type="submit" 
             disabled={pending} 
             className="bg-primary text-white hover:bg-[#feae2c] hover:text-primary font-bold text-[15px] h-auto px-12 py-4 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none"
           >
            {pending ? (
              <>
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                Processing…
              </>
            ) : (
              'Publish vehicle'
            )}
           </Button>
        </div>
      </form>

      {/* Loading Overlay */}
       {pending && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#000615]/80 backdrop-blur-sm animate-in fade-in"
          role="status"
          aria-live="polite"
        >
          <div className="bg-white border-2 border-primary p-12 shadow-[12px_12px_0px_0px_#feae2c] flex flex-col items-center gap-6 animate-in zoom-in duration-300">
             <div className="h-16 w-16 border-2 border-primary bg-primary flex items-center justify-center shadow-[4px_4px_0px_0px_#feae2c]">
                <Car className="text-[#feae2c] h-8 w-8" />
             </div>
             <div className="text-center">
                <p className="text-primary text-xl font-bold uppercase tracking-tight mb-2">Registry update</p>
                <p className="text-[#5c5c55] max-w-[280px] text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                   Synchronizing your asset with the RentNowPk fleet marketplace.
                </p>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-[13px] font-bold text-primary tracking-wide">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
        {hint && (
          <span className="text-[11px] font-normal text-[#5c5c55] tracking-tight">{hint}</span>
        )}
      </div>
      {children}
      {error && <p className="text-[11px] font-bold text-red-600 uppercase tracking-widest">{error}</p>}
    </div>
  )
}

function DriveTypePriceRow({
  id,
  label,
  checked,
  onCheckedChange,
  dayError,
  dayName,
  dayId,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  dayError?: string
  dayName: string
  dayId: string
}) {
  return (
    <div className={cn(
      "space-y-6 transition-all duration-300",
      !checked && "opacity-40"
    )}>
      <div className="flex items-center gap-3">
        <Checkbox 
          id={id} 
          checked={checked} 
          onCheckedChange={(v) => onCheckedChange(v === true)} 
          className="h-5 w-5 border-2 border-primary rounded-none data-[state=checked]:bg-primary"
        />
        <label htmlFor={id} className="text-sm font-bold text-primary cursor-pointer mt-0.5">
          {label}
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <Field label="Daily rate (PKR)">
          <div className="flex items-center border-2 border-[#d4d4c8] bg-white focus-within:border-primary">
            <span className="px-3 font-bold text-primary text-sm shrink-0 border-r-2 border-[#d4d4c8] h-12 flex items-center">Rs</span>
            <Input
              id={dayId}
              name={dayName}
              type="number"
              placeholder="e.g., 4,500"
              disabled={!checked}
              className="border-none h-12 text-sm font-bold bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none w-full"
            />
            <span className="px-3 font-bold text-[#5c5c55] text-[13px] shrink-0">/ day</span>
          </div>
          {dayError && <p className="text-[10px] font-bold text-red-600 mt-1 uppercase">{dayError}</p>}
        </Field>
      </div>
    </div>
  )
}
