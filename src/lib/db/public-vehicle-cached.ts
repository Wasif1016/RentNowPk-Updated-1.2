import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { vehiclePublicTag } from '@/lib/constants/cache-tags'
import { getPublicVehicleDetail, type PublicVehicleDetail } from '@/lib/db/public-vehicles'

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
