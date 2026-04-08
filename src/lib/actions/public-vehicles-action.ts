'use server'

import { FeaturedVehicleCard, searchVehiclesGeneric, VehicleSearchParams } from '@/lib/db/public-vehicles'

export async function fetchMoreVehiclesAction(params: VehicleSearchParams): Promise<FeaturedVehicleCard[]> {
  try {
    return await searchVehiclesGeneric(params)
  } catch (err) {
    console.error('Error fetching more vehicles:', err)
    return []
  }
}
