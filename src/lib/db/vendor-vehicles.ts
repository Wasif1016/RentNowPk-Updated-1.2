import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { vehicleCities, vehicleImages, vehicles } from '@/lib/db/schema'

export type VendorVehicleListRow = {
  id: string
  name: string
  slug: string
  isActive: boolean
  year: number
  coverUrl: string | null
  makeLogoUrl: string | null
  cities: string[]
  pickupFormattedAddress: string | null
}

/** Minimal vehicle list for dropdowns (id + name only). */
export async function listVendorVehiclesForOffer(
  vendorProfileId: string
): Promise<{ id: string; name: string }[]> {
  const rows = await db
    .select({ id: vehicles.id, name: vehicles.name })
    .from(vehicles)
    .where(and(eq(vehicles.vendorId, vendorProfileId), eq(vehicles.isActive, true)))
  return rows
}

export async function listVendorVehiclesWithMeta(
  vendorProfileId: string
): Promise<VendorVehicleListRow[]> {
  const vrows = await db
    .select({
      id: vehicles.id,
      name: vehicles.name,
      slug: vehicles.slug,
      isActive: vehicles.isActive,
      year: vehicles.year,
      coverUrl: vehicleImages.url,
      makeLogoUrl: vehicles.makeLogoUrl,
      pickupFormattedAddress: vehicles.pickupFormattedAddress,
    })
    .from(vehicles)
    .leftJoin(
      vehicleImages,
      and(
        eq(vehicleImages.vehicleId, vehicles.id),
        eq(vehicleImages.isCover, true)
      )
    )
    .where(eq(vehicles.vendorId, vendorProfileId))

  if (vrows.length === 0) return []

  const ids = vrows.map((v) => v.id)
  const cityRows = await db
    .select({
      vehicleId: vehicleCities.vehicleId,
      cityName: vehicleCities.cityName,
    })
    .from(vehicleCities)
    .where(inArray(vehicleCities.vehicleId, ids))

  const cityMap = new Map<string, string[]>()
  for (const c of cityRows) {
    const arr = cityMap.get(c.vehicleId) ?? []
    arr.push(c.cityName)
    cityMap.set(c.vehicleId, arr)
  }

  return vrows.map((v) => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    isActive: v.isActive,
    year: v.year,
    coverUrl: v.coverUrl,
    makeLogoUrl: v.makeLogoUrl,
    cities: cityMap.get(v.id) ?? [],
    pickupFormattedAddress: v.pickupFormattedAddress,
  }))
}
