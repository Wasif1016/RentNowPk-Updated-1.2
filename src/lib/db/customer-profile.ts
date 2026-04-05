import 'server-only'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { customerProfiles, users } from '@/lib/db/schema'

/**
 * Ensures a `customer_profiles` row exists for the given auth user.
 */
export async function ensureCustomerProfile(userId: string): Promise<string> {
  const [existing] = await db
    .select({ id: customerProfiles.id })
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, userId))
    .limit(1)

  if (existing) return existing.id

  const [created] = await db
    .insert(customerProfiles)
    .values({ userId })
    .returning({ id: customerProfiles.id })

  if (!created) throw new Error('Could not create customer profile.')
  return created.id
}

export async function getCustomerBookingPrefill(userId: string): Promise<{
  fullName: string
  cnic: string | null
}> {
  const [u] = await db
    .select({ fullName: users.fullName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  const [cp] = await db
    .select({ cnic: customerProfiles.cnic })
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, userId))
    .limit(1)
  return {
    fullName: u?.fullName?.trim() ?? '',
    cnic: cp?.cnic?.trim() ?? null,
  }
}
