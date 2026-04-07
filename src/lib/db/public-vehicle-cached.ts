import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { vehiclePublicTag } from '@/lib/constants/cache-tags'
import {
  getFeaturedVehicles,
  getPublicVehicleDetail,
  type FeaturedVehicleCard,
  type PublicVehicleDetail,
} from '@/lib/db/public-vehicles'

/**
 * Cached public vehicle detail for PDP (invalidated via {@link vehiclePublicTag}).
 */
export async function getCachedPublicVehicleDetail(
  vendorSlug: string,
  vehicleSlug: string
): Promise<PublicVehicleDetail | null> {
  'use cache'
  cacheLife('standard')
  const detail = await getPublicVehicleDetail(vendorSlug, vehicleSlug)
  if (detail) cacheTag(vehiclePublicTag(detail.id))
  return detail
}

/**
 * Cached featured vehicles for homepage.
 */
export async function getCachedFeaturedVehicles(
  limit = 8
): Promise<FeaturedVehicleCard[]> {
  'use cache'
  cacheLife('standard')
  const vehicles = await getFeaturedVehicles(limit)
  for (const v of vehicles) {
    cacheTag(vehiclePublicTag(v.vehicleId))
  }
  return vehicles
}
