'use server'

import { updateTag } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { getRequiredUser } from '@/lib/auth/session'
import {
  customerBookingsTag,
  unreadMessagesTag,
  vendorBookingsTag,
} from '@/lib/constants/cache-tags'
import { ensureCustomerProfile } from '@/lib/db/customer-profile'
import { db } from '@/lib/db'
import {
  bookings,
  chatThreads,
  customerProfiles,
  messages,
  users,
  vehicles,
  vendorProfiles,
} from '@/lib/db/schema'
import { formString } from '@/lib/form/form-data'
import { getDrivingRouteSummary } from '@/lib/google-maps/directions-distance'
import { getPlaceDetails } from '@/lib/google-maps/places-details'
import { buildBookingRequestSeedContent } from '@/lib/format/booking-seed'
import { BookingRequestSchema } from '@/lib/validation/booking-request'
import type { ZodIssue } from 'zod'

export type BookingRequestState =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string> }

function fieldErr(issues: ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const k = issue.path[0]
    if (typeof k === 'string' && !out[k]) out[k] = issue.message
  }
  return out
}

export async function createBookingRequest(
  _prev: BookingRequestState | null,
  formData: FormData
): Promise<BookingRequestState> {
  const raw = {
    vehicleId: formString(formData, 'vehicleId'),
    pickupPlaceId: formString(formData, 'pickupPlaceId'),
    dropoffPlaceId: formString(formData, 'dropoffPlaceId'),
    pickupAt: formString(formData, 'pickupAt'),
    dropoffAt: formString(formData, 'dropoffAt'),
    driveType: formString(formData, 'driveType'),
    fullName: formString(formData, 'fullName'),
    cnic: formString(formData, 'cnic').replace(/\D/g, ''),
    note: formString(formData, 'note'),
  }

  const parsed = BookingRequestSchema.safeParse({
    ...raw,
    driveType:
      raw.driveType === 'SELF_DRIVE' || raw.driveType === 'WITH_DRIVER'
        ? raw.driveType
        : ('' as const),
  })

  if (!parsed.success) {
    return { success: false, error: 'Check the form.', fieldErrors: fieldErr(parsed.error.issues) }
  }

  const user = await getRequiredUser('CUSTOMER')

  const [row] = await db
    .select({
      vehicle: vehicles,
      vendorProfileId: vendorProfiles.id,
      vendorUserId: vendorProfiles.userId,
    })
    .from(vehicles)
    .innerJoin(vendorProfiles, eq(vehicles.vendorId, vendorProfiles.id))
    .where(
      and(
        eq(vehicles.id, parsed.data.vehicleId),
        eq(vendorProfiles.verificationStatus, 'APPROVED'),
        eq(vehicles.isActive, true)
      )
    )
    .limit(1)

  if (!row) {
    return { success: false, error: 'This vehicle is not available for booking.' }
  }

  const { vehicle } = row
  if (parsed.data.driveType === 'WITH_DRIVER' && !vehicle.withDriverEnabled) {
    return { success: false, error: 'With-driver is not offered for this vehicle.' }
  }
  if (parsed.data.driveType === 'SELF_DRIVE' && !vehicle.selfDriveEnabled) {
    return { success: false, error: 'Self-drive is not offered for this vehicle.' }
  }

  const [pickup, dropoff] = await Promise.all([
    getPlaceDetails(parsed.data.pickupPlaceId),
    getPlaceDetails(parsed.data.dropoffPlaceId),
  ])

  if (!pickup || !dropoff) {
    return { success: false, error: 'Could not verify pickup or drop-off locations.' }
  }

  const route = await getDrivingRouteSummary(
    pickup.lat,
    pickup.lng,
    dropoff.lat,
    dropoff.lng
  )

  const customerProfileId = await ensureCustomerProfile(user.id)

  const pickupAt = new Date(parsed.data.pickupAt)
  const dropoffAt = new Date(parsed.data.dropoffAt)

  const distanceStr = route != null ? String(route.distanceKm.toFixed(3)) : null

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        fullName: parsed.data.fullName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    await tx
      .update(customerProfiles)
      .set({
        cnic: parsed.data.cnic,
        updatedAt: new Date(),
      })
      .where(eq(customerProfiles.userId, user.id))

    const [insertedBooking] = await tx
      .insert(bookings)
      .values({
        vehicleId: vehicle.id,
        vendorId: row.vendorProfileId,
        customerProfileId,
        customerUserId: user.id,
        vendorUserId: row.vendorUserId,
        pickupAddress: pickup.formattedAddress,
        dropoffAddress: dropoff.formattedAddress,
        pickupPlaceId: pickup.placeId,
        dropoffPlaceId: dropoff.placeId,
        pickupAt,
        dropoffAt,
        driveType: parsed.data.driveType,
        distanceKm: distanceStr,
        status: 'PENDING',
        note: parsed.data.note || null,
      })
      .returning({ id: bookings.id })

    const [thread] = await tx
      .insert(chatThreads)
      .values({
        bookingId: insertedBooking.id,
        customerUserId: user.id,
        vendorUserId: row.vendorUserId,
      })
      .returning({ id: chatThreads.id })

    const seedContent = buildBookingRequestSeedContent({
      pickupAddress: pickup.formattedAddress,
      dropoffAddress: dropoff.formattedAddress,
      pickupAt,
      dropoffAt,
      driveType: parsed.data.driveType,
      distanceKm: distanceStr,
      note: parsed.data.note || null,
    })

    const now = new Date()
    await tx.insert(messages).values({
      threadId: thread.id,
      senderId: user.id,
      content: seedContent,
      createdAt: now,
    })

    await tx
      .update(chatThreads)
      .set({ lastMessageAt: now })
      .where(eq(chatThreads.id, thread.id))
  })

  updateTag(customerBookingsTag(user.id))
  updateTag(vendorBookingsTag(row.vendorUserId))
  updateTag(unreadMessagesTag(row.vendorUserId))

  return { success: true }
}
