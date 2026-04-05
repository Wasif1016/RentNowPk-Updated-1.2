'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { getRequiredUser } from '@/lib/auth/session'
import {
  destroyCloudinaryImage,
  uploadVehicleImage,
} from '@/lib/cloudinary/server'
import { vehiclePublicTag, vendorVehiclesTag } from '@/lib/constants/cache-tags'
import { db } from '@/lib/db'
import { vehicleCities, vehicleImages, vehicles } from '@/lib/db/schema'
import { getVendorProfileByUserId } from '@/lib/db/vendor-profile'
import { formString } from '@/lib/form/form-data'
import { resolvePickupLocation } from '@/lib/vehicles/resolve-pickup'
import {
  ensureUniqueVendorVehicleSlug,
  slugifyVehicleBase,
} from '@/lib/vehicles/slug'
import type { ZodIssue } from 'zod'
import { buildLogoDevMakeImageUrl } from '@/lib/logo-dev/server'
import {
  createVehicleFieldsSchema,
  dedupeCities,
  normalizeMoneyString,
} from '@/lib/validation/vehicle'

export type CreateVehicleFieldKey =
  | 'name'
  | 'make'
  | 'model'
  | 'year'
  | 'withDriverEnabled'
  | 'selfDriveEnabled'
  | 'priceWithDriverDay'
  | 'priceWithDriverMonth'
  | 'priceSelfDriveDay'
  | 'priceSelfDriveMonth'
  | 'coverIndex'
  | 'images'
  | 'pickupLatitude'
  | 'pickupLongitude'
  | 'pickupPlaceId'
  | 'pickupFormattedAddress'
  | 'pickup'

export type CreateVehicleResult = {
  ok: false
  message: string
  fieldErrors?: Partial<Record<CreateVehicleFieldKey, string>>
}

function sanitizePublicIdSegment(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || 'img'
}

async function readImagePart(
  part: FormDataEntryValue,
  index: number
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (typeof part === 'string' || !part || part.size === 0) {
    throw new Error(`Image ${index + 1} is invalid.`)
  }
  const mimeType = part.type || 'application/octet-stream'
  const ab = await part.arrayBuffer()
  return { buffer: Buffer.from(ab), mimeType }
}

function zodToFieldErrors(
  issues: ZodIssue[]
): Partial<Record<CreateVehicleFieldKey, string>> {
  const fieldErrors: Partial<Record<CreateVehicleFieldKey, string>> = {}
  for (const issue of issues) {
    const path = issue.path
    let key: CreateVehicleFieldKey | null = null
    if (path.length === 0) continue
    const head = path[0]
    if (typeof head === 'string') {
      if (
        head === 'name' ||
        head === 'make' ||
        head === 'model' ||
        head === 'year' ||
        head === 'withDriverEnabled' ||
        head === 'selfDriveEnabled' ||
        head === 'priceWithDriverDay' ||
        head === 'priceWithDriverMonth' ||
        head === 'priceSelfDriveDay' ||
        head === 'priceSelfDriveMonth' ||
        head === 'coverIndex' ||
        head === 'pickupLatitude' ||
        head === 'pickupLongitude' ||
        head === 'pickupPlaceId' ||
        head === 'pickupFormattedAddress'
      ) {
        key = head
      }
    }
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.message
    }
  }
  return fieldErrors
}

export async function createVehicle(
  _prev: CreateVehicleResult | null,
  formData: FormData
): Promise<CreateVehicleResult | void> {
  const user = await getRequiredUser('VENDOR')
  const profile = await getVendorProfileByUserId(user.id)
  if (!profile) {
    return { ok: false, message: 'Vendor profile not found.' }
  }

  if (profile.verificationStatus === 'SUSPENDED') {
    return {
      ok: false,
      message: 'Your account is suspended. You cannot add vehicles.',
    }
  }

  const imageParts = formData
    .getAll('images')
    .filter((p): p is File => p instanceof File && p.size > 0)

  if (imageParts.length === 0) {
    return {
      ok: false,
      message: 'Add at least one photo.',
      fieldErrors: { images: 'Add at least one photo.' },
    }
  }
  if (imageParts.length > 5) {
    return {
      ok: false,
      message: 'You can upload at most 5 photos.',
      fieldErrors: { images: 'At most 5 photos.' },
    }
  }

  const raw = {
    name: formString(formData, 'name'),
    make: formString(formData, 'make'),
    model: formString(formData, 'model'),
    year: formString(formData, 'year'),
    withDriverEnabled: formData.get('withDriverEnabled') === 'on',
    selfDriveEnabled: formData.get('selfDriveEnabled') === 'on',
    priceWithDriverDay: formString(formData, 'priceWithDriverDay'),
    priceWithDriverMonth: formString(formData, 'priceWithDriverMonth'),
    priceSelfDriveDay: formString(formData, 'priceSelfDriveDay'),
    priceSelfDriveMonth: formString(formData, 'priceSelfDriveMonth'),
    coverIndex: formString(formData, 'coverIndex'),
    pickupLatitude: formString(formData, 'pickupLatitude'),
    pickupLongitude: formString(formData, 'pickupLongitude'),
    pickupPlaceId: formString(formData, 'pickupPlaceId'),
    pickupFormattedAddress: formString(formData, 'pickupFormattedAddress'),
  }

  const parsed = createVehicleFieldsSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Check the form for errors.',
      fieldErrors: zodToFieldErrors(parsed.error.issues),
    }
  }

  const data = parsed.data
  const coverIndex = data.coverIndex
  if (coverIndex < 0 || coverIndex >= imageParts.length) {
    return {
      ok: false,
      message: 'Invalid cover photo selection.',
      fieldErrors: { coverIndex: 'Choose which image is the cover.' },
    }
  }

  const baseSlug = slugifyVehicleBase(data.name, data.model, data.year)

  const pickupResult = await resolvePickupLocation({
    pickupLatitude: data.pickupLatitude,
    pickupLongitude: data.pickupLongitude,
    pickupPlaceId: data.pickupPlaceId,
  })
  if (!pickupResult.ok) {
    return {
      ok: false,
      message: pickupResult.message,
      fieldErrors: { pickup: pickupResult.message },
    }
  }
  const pickup = pickupResult.pickup

  const cities = dedupeCities(pickup.cityName ? [pickup.cityName] : [])
  if (cities.length === 0) {
    return {
      ok: false,
      message: 'Could not determine city from pickup. Try a more specific address or another location.',
      fieldErrors: {
        pickup:
          'Could not determine city from this location. Search for a street or area, or move the pin.',
      },
    }
  }

  let vehicleId: string | null = null
  const uploadedPublicIds: string[] = []

  try {
    const inserted = await db.transaction(async (tx) => {
      const slug = await ensureUniqueVendorVehicleSlug(tx, profile.id, baseSlug)

      const [row] = await tx
        .insert(vehicles)
        .values({
          vendorId: profile.id,
          slug,
          name: data.name.trim(),
          make: data.make.trim(),
          model: data.model.trim(),
          year: data.year,
          withDriverEnabled: data.withDriverEnabled,
          selfDriveEnabled: data.selfDriveEnabled,
          priceWithDriverDay:
            data.withDriverEnabled && data.priceWithDriverDay
              ? normalizeMoneyString(data.priceWithDriverDay)
              : null,
          priceWithDriverMonth:
            data.withDriverEnabled && data.priceWithDriverMonth
              ? normalizeMoneyString(data.priceWithDriverMonth)
              : null,
          priceSelfDriveDay:
            data.selfDriveEnabled && data.priceSelfDriveDay
              ? normalizeMoneyString(data.priceSelfDriveDay)
              : null,
          priceSelfDriveMonth:
            data.selfDriveEnabled && data.priceSelfDriveMonth
              ? normalizeMoneyString(data.priceSelfDriveMonth)
              : null,
          isActive: true,
          pickupLatitude: pickup.lat,
          pickupLongitude: pickup.lng,
          pickupPlaceId: pickup.placeId,
          pickupFormattedAddress: pickup.formattedAddress,
        })
        .returning({ id: vehicles.id })

      if (!row) {
        throw new Error('Failed to create vehicle.')
      }

      await tx.insert(vehicleCities).values(
        cities.map((cityName) => ({
          vehicleId: row.id,
          cityName,
        }))
      )

      return row
    })

    vehicleId = inserted.id

    const makeLogoUrl = buildLogoDevMakeImageUrl(data.make.trim())
    if (makeLogoUrl) {
      await db
        .update(vehicles)
        .set({ makeLogoUrl })
        .where(eq(vehicles.id, inserted.id))
    }

    const buffers = await Promise.all(
      imageParts.map((file, i) => readImagePart(file, i))
    )

    const uploadResults = await Promise.all(
      buffers.map(({ buffer, mimeType }, i) =>
        uploadVehicleImage({
          vehicleId: inserted.id,
          publicId: `img_${i}_${sanitizePublicIdSegment(crypto.randomUUID())}`,
          mimeType,
          buffer,
        })
      )
    )

    for (const r of uploadResults) {
      uploadedPublicIds.push(r.publicId)
    }

    await db.insert(vehicleImages).values(
      uploadResults.map((r, i) => ({
        vehicleId: inserted.id,
        url: r.url,
        sortOrder: i,
        isCover: i === coverIndex,
      }))
    )
  } catch (e) {
    for (const pid of uploadedPublicIds) {
      await destroyCloudinaryImage(pid)
    }
    if (vehicleId) {
      await db.delete(vehicles).where(eq(vehicles.id, vehicleId))
    }
    const message =
      e instanceof Error ? e.message : 'Something went wrong. Try again.'
    return { ok: false, message }
  }

  updateTag(vendorVehiclesTag(profile.id))
  if (vehicleId) updateTag(vehiclePublicTag(vehicleId))
  revalidatePath('/vendor/vehicles')
  revalidatePath('/vendor', 'layout')
  redirect('/vendor/vehicles?created=1')
}
