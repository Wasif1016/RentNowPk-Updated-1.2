'use server'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { getRequiredUser } from '@/lib/auth/session'
import {
  bookingTag,
  customerBookingsTag,
  vendorBookingsTag,
} from '@/lib/constants/cache-tags'
import { db } from '@/lib/db'
import {
  bookingOffers,
  bookings,
  vehicles,
  vendorProfiles,
} from '@/lib/db/schema'

async function requireVendor() {
  const user = await getRequiredUser('VENDOR')
  const [vp] = await db
    .select({ id: vendorProfiles.id })
    .from(vendorProfiles)
    .where(eq(vendorProfiles.userId, user.id))
    .limit(1)
  if (!vp) { redirect('/vendor') }
  return { ...user, vendorProfileId: vp.id }
}

async function requireCustomer() {
  const user = await getRequiredUser('CUSTOMER')
  return user
}

export type CreateOfferResult =
  | { ok: true; offerId: string }
  | { ok: false; error: string }

export async function createOfferFromChat(
  bookingId: string,
  vehicleId: string,
  pricePerDay: string,
  totalPrice: string,
  note: string
): Promise<CreateOfferResult> {
  const user = await requireVendor()

  // Verify this booking belongs to this vendor
  const [booking] = await db
    .select({ id: bookings.id, vendorUserId: bookings.vendorUserId })
    .from(bookings)
    .where(eq(bookings.id, bookingId))

  if (!booking) {
    return { ok: false, error: 'Booking not found.' }
  }
  if (booking.vendorUserId !== user.id) {
    return { ok: false, error: 'Not authorized.' }
  }

  const [vehicle] = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.vendorId, user.vendorProfileId)))

  if (!vehicle) {
    return { ok: false, error: 'Vehicle not found.' }
  }

  const [offer] = await db
    .insert(bookingOffers)
    .values({
      bookingId,
      vehicleId,
      vendorId: user.vendorProfileId,
      pricePerDay,
      totalPrice,
      note: note || null,
    })
    .returning({ id: bookingOffers.id })

  if (!offer) {
    return { ok: false, error: 'Failed to create offer.' }
  }

  updateTag(bookingTag(bookingId))
  updateTag(vendorBookingsTag(user.id))

  return { ok: true, offerId: offer.id }
}

export type AcceptOfferResult =
  | { ok: true }
  | { ok: false; error: string }

export async function acceptOfferFromChat(
  offerId: string
): Promise<AcceptOfferResult> {
  const user = await requireCustomer()

  const [offer] = await db
    .select()
    .from(bookingOffers)
    .where(and(eq(bookingOffers.id, offerId), eq(bookingOffers.status, 'PENDING')))

  if (!offer) {
    return { ok: false, error: 'Offer not found or already responded.' }
  }

  const [booking] = await db
    .select({ id: bookings.id, customerUserId: bookings.customerUserId })
    .from(bookings)
    .where(eq(bookings.id, offer.bookingId))

  if (!booking || booking.customerUserId !== user.id) {
    return { ok: false, error: 'Not authorized.' }
  }

  const now = new Date()
  await db
    .update(bookingOffers)
    .set({ status: 'ACCEPTED', respondedAt: now })
    .where(eq(bookingOffers.id, offerId))

  // Update booking with the new vehicle and price from offer
  await db
    .update(bookings)
    .set({
      vehicleId: offer.vehicleId,
      status: 'CONFIRMED',
      updatedAt: now,
    })
    .where(eq(bookings.id, offer.bookingId))

  updateTag(bookingTag(offer.bookingId))
  updateTag(customerBookingsTag(user.id))

  return { ok: true }
}

export type RejectOfferResult =
  | { ok: true }
  | { ok: false; error: string }

export async function rejectOfferFromChat(
  offerId: string
): Promise<RejectOfferResult> {
  const user = await requireCustomer()

  const [offer] = await db
    .select()
    .from(bookingOffers)
    .where(and(eq(bookingOffers.id, offerId), eq(bookingOffers.status, 'PENDING')))

  if (!offer) {
    return { ok: false, error: 'Offer not found or already responded.' }
  }

  const [booking] = await db
    .select({ id: bookings.id, customerUserId: bookings.customerUserId })
    .from(bookings)
    .where(eq(bookings.id, offer.bookingId))

  if (!booking || booking.customerUserId !== user.id) {
    return { ok: false, error: 'Not authorized.' }
  }

  await db
    .update(bookingOffers)
    .set({ status: 'REJECTED', respondedAt: new Date() })
    .where(eq(bookingOffers.id, offerId))

  updateTag(bookingTag(offer.bookingId))
  updateTag(customerBookingsTag(user.id))

  return { ok: true }
}
