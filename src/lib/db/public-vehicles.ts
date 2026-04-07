import 'server-only'

import { and, asc, desc, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  vehicleCities,
  vehicleImages,
  vehicles,
  vendorProfiles,
} from '@/lib/db/schema'
import { findVehiclesNearPoint } from '@/lib/db/vehicle-geo-search'

export type PublicVehicleImage = {
  id: string
  url: string
  sortOrder: number
  isCover: boolean
}

export type PublicVehicleDetail = {
  id: string
  slug: string
  name: string
  make: string
  makeLogoUrl: string | null
  model: string
  year: number
  withDriverEnabled: boolean
  selfDriveEnabled: boolean
  priceWithDriverDay: string | null
  priceWithDriverMonth: string | null
  priceSelfDriveDay: string | null
  priceSelfDriveMonth: string | null
  pickupLatitude: number | null
  pickupLongitude: number | null
  pickupFormattedAddress: string | null
  vendor: {
    id: string
    publicSlug: string
    businessName: string
    avgRating: string
    totalReviews: number
    businessLogoUrl: string | null
  }
  images: PublicVehicleImage[]
  cities: string[]
}

export type PublicVehicleCard = {
  vehicleId: string
  vendorSlug: string
  vehicleSlug: string
  name: string
  make: string
  makeLogoUrl: string | null
  model: string
  year: number
  distanceKm: number
  coverImageUrl: string | null
  withDriverEnabled: boolean
  selfDriveEnabled: boolean
  /** Smallest enabled per-day price as decimal string (for display). */
  minDayPrice: string | null
  pickupFormattedAddress: string | null
  vendorBusinessName: string
}

function minEnabledDayPrice(v: {
  withDriverEnabled: boolean
  selfDriveEnabled: boolean
  priceWithDriverDay: string | null
  priceSelfDriveDay: string | null
}): string | null {
  const opts: string[] = []
  if (v.withDriverEnabled && v.priceWithDriverDay) opts.push(v.priceWithDriverDay)
  if (v.selfDriveEnabled && v.priceSelfDriveDay) opts.push(v.priceSelfDriveDay)
  if (opts.length === 0) return null
  return opts.reduce((a, b) => (parseFloat(a) <= parseFloat(b) ? a : b))
}

/**
 * Single public vehicle (approved vendor, active listing).
 */
export async function getPublicVehicleDetail(
  vendorSlug: string,
  vehicleSlug: string
): Promise<PublicVehicleDetail | null> {
  const [row] = await db
    .select({
      vehicle: vehicles,
      vendor: {
        id: vendorProfiles.id,
        publicSlug: vendorProfiles.publicSlug,
        businessName: vendorProfiles.businessName,
        avgRating: vendorProfiles.avgRating,
        totalReviews: vendorProfiles.totalReviews,
        businessLogoUrl: vendorProfiles.businessLogoUrl,
      },
    })
    .from(vehicles)
    .innerJoin(vendorProfiles, eq(vehicles.vendorId, vendorProfiles.id))
    .where(
      and(
        eq(vendorProfiles.publicSlug, vendorSlug),
        eq(vehicles.slug, vehicleSlug),
        eq(vendorProfiles.verificationStatus, 'APPROVED'),
        eq(vehicles.isActive, true)
      )
    )
    .limit(1)

  if (!row) return null

  const vid = row.vehicle.id

  const [imgs, cityRows] = await Promise.all([
    db
      .select({
        id: vehicleImages.id,
        url: vehicleImages.url,
        sortOrder: vehicleImages.sortOrder,
        isCover: vehicleImages.isCover,
      })
      .from(vehicleImages)
      .where(eq(vehicleImages.vehicleId, vid))
      .orderBy(asc(vehicleImages.sortOrder), asc(vehicleImages.id)),
    db
      .select({ cityName: vehicleCities.cityName })
      .from(vehicleCities)
      .where(eq(vehicleCities.vehicleId, vid)),
  ])

  const v = row.vehicle
  return {
    id: v.id,
    slug: v.slug,
    name: v.name,
    make: v.make,
    makeLogoUrl: v.makeLogoUrl,
    model: v.model,
    year: v.year,
    withDriverEnabled: v.withDriverEnabled,
    selfDriveEnabled: v.selfDriveEnabled,
    priceWithDriverDay: v.priceWithDriverDay,
    priceWithDriverMonth: v.priceWithDriverMonth,
    priceSelfDriveDay: v.priceSelfDriveDay,
    priceSelfDriveMonth: v.priceSelfDriveMonth,
    pickupLatitude: v.pickupLatitude,
    pickupLongitude: v.pickupLongitude,
    pickupFormattedAddress: v.pickupFormattedAddress,
    vendor: row.vendor,
    images: imgs,
    cities: cityRows.map((c) => c.cityName),
  }
}

function pickCoverUrl(
  images: Array<{ url: string; isCover: boolean; sortOrder: number }>
): string | null {
  if (images.length === 0) return null
  const cover = images.find((i) => i.isCover)
  if (cover) return cover.url
  return [...images].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url ?? null
}

/**
 * Vehicles near a pickup point with card fields for search results.
 */
export async function searchPublicVehiclesNearPickup(params: {
  lat: number
  lng: number
  radiusKm: number
  limit?: number
}): Promise<PublicVehicleCard[]> {
  const near = await findVehiclesNearPoint({
    lat: params.lat,
    lng: params.lng,
    radiusKm: params.radiusKm,
    limit: params.limit ?? 50,
    vendorApprovedOnly: true,
    activeOnly: true,
  })

  if (near.length === 0) return []

  const ids = near.map((n) => n.vehicleId)
  const distById = new Map(near.map((n) => [n.vehicleId, n.distanceKm] as const))

  const rows = await db
    .select({
      vehicle: vehicles,
      vendorSlug: vendorProfiles.publicSlug,
      vendorBusinessName: vendorProfiles.businessName,
    })
    .from(vehicles)
    .innerJoin(vendorProfiles, eq(vehicles.vendorId, vendorProfiles.id))
    .where(inArray(vehicles.id, ids))

  const imgRows = await db
    .select({
      vehicleId: vehicleImages.vehicleId,
      url: vehicleImages.url,
      isCover: vehicleImages.isCover,
      sortOrder: vehicleImages.sortOrder,
    })
    .from(vehicleImages)
    .where(inArray(vehicleImages.vehicleId, ids))

  const imagesByVehicle = new Map<
    string,
    Array<{ url: string; isCover: boolean; sortOrder: number }>
  >()
  for (const im of imgRows) {
    const list = imagesByVehicle.get(im.vehicleId) ?? []
    list.push(im)
    imagesByVehicle.set(im.vehicleId, list)
  }

  const rowById = new Map(rows.map((r) => [r.vehicle.id, r] as const))

  const ordered: PublicVehicleCard[] = []
  for (const n of near) {
    const r = rowById.get(n.vehicleId)
    if (!r) continue
    const v = r.vehicle
    const imgs = imagesByVehicle.get(v.id) ?? []
    ordered.push({
      vehicleId: v.id,
      vendorSlug: r.vendorSlug,
      vehicleSlug: v.slug,
      name: v.name,
      make: v.make,
      makeLogoUrl: v.makeLogoUrl,
      model: v.model,
      year: v.year,
      distanceKm: distById.get(v.id) ?? n.distanceKm,
      coverImageUrl: pickCoverUrl(imgs),
      withDriverEnabled: v.withDriverEnabled,
      selfDriveEnabled: v.selfDriveEnabled,
      minDayPrice: minEnabledDayPrice(v),
      pickupFormattedAddress: v.pickupFormattedAddress,
      vendorBusinessName: r.vendorBusinessName,
    })
  }

  return ordered
}

export type FeaturedVehicleCard = {
  vehicleId: string
  vendorSlug: string
  vehicleSlug: string
  name: string
  make: string
  model: string
  year: number
  coverImageUrl: string | null
  withDriverEnabled: boolean
  selfDriveEnabled: boolean
  minDayPrice: string | null
  avgRating: string
  totalReviews: number
}

/**
 * Featured vehicles for the homepage — returns up to `limit` active vehicles
 * from approved vendors, ordered by rating then creation date.
 */
export async function getFeaturedVehicles(limit = 8): Promise<FeaturedVehicleCard[]> {
  const rows = await db
    .select({
      vehicle: vehicles,
      vendorSlug: vendorProfiles.publicSlug,
      avgRating: vendorProfiles.avgRating,
      totalReviews: vendorProfiles.totalReviews,
    })
    .from(vehicles)
    .innerJoin(vendorProfiles, eq(vehicles.vendorId, vendorProfiles.id))
    .where(
      and(
        eq(vendorProfiles.verificationStatus, 'APPROVED'),
        eq(vehicles.isActive, true)
      )
    )
    .orderBy(
      desc(sql`COALESCE(NULLIF(${vendorProfiles.avgRating}, '0'), '0')::numeric`),
      desc(vehicles.createdAt)
    )
    .limit(limit)

  if (rows.length === 0) return []

  const ids = rows.map((r) => r.vehicle.id)

  const imgRows = await db
    .select({
      vehicleId: vehicleImages.vehicleId,
      url: vehicleImages.url,
      isCover: vehicleImages.isCover,
      sortOrder: vehicleImages.sortOrder,
    })
    .from(vehicleImages)
    .where(inArray(vehicleImages.vehicleId, ids))

  const imagesByVehicle = new Map<
    string,
    Array<{ url: string; isCover: boolean; sortOrder: number }>
  >()
  for (const im of imgRows) {
    const list = imagesByVehicle.get(im.vehicleId) ?? []
    list.push(im)
    imagesByVehicle.set(im.vehicleId, list)
  }

  return rows.map((r) => {
    const v = r.vehicle
    const imgs = imagesByVehicle.get(v.id) ?? []
    return {
      vehicleId: v.id,
      vendorSlug: r.vendorSlug,
      vehicleSlug: v.slug,
      name: v.name,
      make: v.make,
      model: v.model,
      year: v.year,
      coverImageUrl: pickCoverUrl(imgs),
      withDriverEnabled: v.withDriverEnabled,
      selfDriveEnabled: v.selfDriveEnabled,
      minDayPrice: minEnabledDayPrice(v),
      avgRating: r.avgRating ?? '0',
      totalReviews: r.totalReviews ?? 0,
    }
  })
}
