import 'server-only'

import { and, asc, desc, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  reviews,
  users,
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
    createdAt: Date
  }
  images: PublicVehicleImage[]
  cities: string[]
  reviews: {
    id: string
    rating: number
    comment: string | null
    createdAt: Date
    customerName: string
  }[]
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
        createdAt: vendorProfiles.createdAt,
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

  const [imgs, cityRows, reviewRows] = await Promise.all([
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
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        customerName: users.fullName,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.customerUserId, users.id))
      .where(eq(reviews.vehicleId, vid))
      .orderBy(desc(reviews.createdAt))
      .limit(10),
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
    reviews: reviewRows.map((r) => ({
      ...r,
      customerName: r.customerName || 'Anonymous',
    })),
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
  vendorName: string
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
  city: string | null
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
      vendorName: vendorProfiles.businessName,
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
      desc(sql<string>`COALESCE(${vendorProfiles.avgRating}, '0')::numeric`),
      desc(vehicles.createdAt)
    )
    .limit(limit)

  if (rows.length === 0) return []
  const ids = rows.map((r) => r.vehicle.id)

  const [imgRows, cityRows] = await Promise.all([
    db
      .select({
        vehicleId: vehicleImages.vehicleId,
        url: vehicleImages.url,
        isCover: vehicleImages.isCover,
        sortOrder: vehicleImages.sortOrder,
      })
      .from(vehicleImages)
      .where(inArray(vehicleImages.vehicleId, ids)),
    db
      .select({
        vehicleId: vehicleCities.vehicleId,
        cityName: vehicleCities.cityName,
      })
      .from(vehicleCities)
      .where(inArray(vehicleCities.vehicleId, ids)),
  ])

  const imagesByVehicle = new Map<
    string,
    Array<{ url: string; isCover: boolean; sortOrder: number }>
  >()
  for (const im of imgRows) {
    const list = imagesByVehicle.get(im.vehicleId) ?? []
    list.push(im)
    imagesByVehicle.set(im.vehicleId, list)
  }

  const citiesByVehicle = new Map<string, string>()
  for (const c of cityRows) {
    if (!citiesByVehicle.has(c.vehicleId)) {
      citiesByVehicle.set(c.vehicleId, c.cityName)
    }
  }

  return rows.map((r) => {
    const v = r.vehicle
    const imgs = imagesByVehicle.get(v.id) ?? []
    return {
      vehicleId: v.id,
      vendorSlug: r.vendorSlug,
      vendorName: r.vendorName ?? 'Vendor',
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
      city: citiesByVehicle.get(v.id) ?? null,
    }
  })
}
/**
 * Get unique makes, cities, and max price for filter sidebar.
 */
export async function getSearchMetadata() {
  const [makes, cities, maxPriceRow] = await Promise.all([
    db.selectDistinct({ make: vehicles.make }).from(vehicles).where(eq(vehicles.isActive, true)),
    db.selectDistinct({ cityName: vehicleCities.cityName }).from(vehicleCities),
    db.select({ 
      maxPrice: sql<string>`MAX(LEAST(COALESCE(${vehicles.priceWithDriverDay}, 999999), COALESCE(${vehicles.priceSelfDriveDay}, 999999)))` 
    }).from(vehicles).where(eq(vehicles.isActive, true))
  ])

  return {
    makes: makes.map(m => m.make).filter(Boolean).sort(),
    cities: cities.map(c => c.cityName).filter(Boolean).sort(),
    maxPrice: maxPriceRow[0]?.maxPrice ? parseFloat(maxPriceRow[0].maxPrice) : 50000
  }
}

export type VehicleSearchParams = {
  make?: string[]
  city?: string[]
  minPrice?: number
  maxPrice?: number
  driveType?: 'SELF_DRIVE' | 'WITH_DRIVER' | 'BOTH'
  query?: string
  limit?: number
  offset?: number
}

/**
 * Generic search with multiple filters and optional location awareness.
 */
export async function searchVehiclesGeneric(params: VehicleSearchParams): Promise<FeaturedVehicleCard[]> {
  const { 
    make, city, minPrice, maxPrice, driveType, query, limit = 12, offset = 0 
  } = params

  const filters = [
    eq(vehicles.isActive, true),
    eq(vendorProfiles.verificationStatus, 'APPROVED')
  ]

  if (make && make.length > 0) {
    filters.push(inArray(vehicles.make, make))
  }

  if (driveType === 'SELF_DRIVE') {
    filters.push(eq(vehicles.selfDriveEnabled, true))
  } else if (driveType === 'WITH_DRIVER') {
    filters.push(eq(vehicles.withDriverEnabled, true))
  }

  if (query) {
    filters.push(sql`${vehicles.name} ILIKE ${'%' + query + '%'}`)
  }

  // Join with cities if filtering by city
  let baseQuery = db
    .select({
      vehicle: vehicles,
      vendorSlug: vendorProfiles.publicSlug,
      vendorName: vendorProfiles.businessName,
      avgRating: vendorProfiles.avgRating,
      totalReviews: vendorProfiles.totalReviews,
    })
    .from(vehicles)
    .innerJoin(vendorProfiles, eq(vehicles.vendorId, vendorProfiles.id))

  if (city && city.length > 0) {
    baseQuery = baseQuery.innerJoin(vehicleCities, eq(vehicles.id, vehicleCities.vehicleId)) as any
    filters.push(inArray(vehicleCities.cityName, city))
  }

  const rows = await baseQuery
    .where(and(...filters))
    .orderBy(
      desc(sql<string>`COALESCE(${vendorProfiles.avgRating}, '0')::numeric`),
      desc(vehicles.createdAt)
    )
    .limit(limit)
    .offset(offset)

  if (rows.length === 0) return []
  const ids = rows.map((r) => r.vehicle.id)

  const [imgRows, cityRows] = await Promise.all([
    db
      .select({
        vehicleId: vehicleImages.vehicleId,
        url: vehicleImages.url,
        isCover: vehicleImages.isCover,
        sortOrder: vehicleImages.sortOrder,
      })
      .from(vehicleImages)
      .where(inArray(vehicleImages.vehicleId, ids)),
    db
      .select({
        vehicleId: vehicleCities.vehicleId,
        cityName: vehicleCities.cityName,
      })
      .from(vehicleCities)
      .where(inArray(vehicleCities.vehicleId, ids)),
  ])

  const imagesByVehicle = new Map<
    string,
    Array<{ url: string; isCover: boolean; sortOrder: number }>
  >()
  for (const im of imgRows) {
    const list = imagesByVehicle.get(im.vehicleId) ?? []
    list.push(im)
    imagesByVehicle.set(im.vehicleId, list)
  }

  const citiesByVehicle = new Map<string, string>()
  for (const c of cityRows) {
    if (!citiesByVehicle.has(c.vehicleId)) {
      citiesByVehicle.set(c.vehicleId, c.cityName)
    }
  }

  const results = rows.map((r) => {
    const v = r.vehicle
    const imgs = imagesByVehicle.get(v.id) ?? []
    
    // Price filter after DB query if it's complex, or we can add it to SQL if simple.
    // For now we do a basic check.
    const minDayPriceStr = minEnabledDayPrice(v)
    const priceVal = minDayPriceStr ? parseFloat(minDayPriceStr) : null

    if (minPrice !== undefined && priceVal !== null && priceVal < minPrice) return null
    if (maxPrice !== undefined && priceVal !== null && priceVal > maxPrice) return null

    return {
      vehicleId: v.id,
      vendorSlug: r.vendorSlug,
      vendorName: r.vendorName ?? 'Vendor',
      vehicleSlug: v.slug,
      name: v.name,
      make: v.make,
      model: v.model,
      year: v.year,
      coverImageUrl: pickCoverUrl(imgs),
      withDriverEnabled: v.withDriverEnabled,
      selfDriveEnabled: v.selfDriveEnabled,
      minDayPrice: minDayPriceStr,
      avgRating: r.avgRating ?? '0',
      totalReviews: r.totalReviews ?? 0,
      city: citiesByVehicle.get(v.id) ?? null,
    }
  })

  return results.filter(Boolean) as FeaturedVehicleCard[]
}
