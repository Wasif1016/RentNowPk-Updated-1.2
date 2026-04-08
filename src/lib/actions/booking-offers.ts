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
  bookings,
  vehicles,
  bookingOffers,
  chatThreads,
  messages,
} from '@/lib/db/schema'
import { broadcastChatEvent, dtoToBroadcastPayload } from '@/lib/chat/realtime'
import { ChatMessageDto } from '@/lib/db/chat'
async function requireUser() {
  const user = await getRequiredUser()
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
  const user = await requireUser()

  // 1. Fetch booking context
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1)

  if (!booking) {
    return { ok: false, error: 'Booking not found.' }
  }

  const isCustomer = booking.customerUserId === user.id
  const isVendor = booking.vendorUserId === user.id

  if (!isCustomer && !isVendor) {
    return { ok: false, error: 'Not authorized for this booking.' }
  }

  // 2. Verify vehicle belongs to the vendor of this booking
  const [vehicle] = await db
    .select({ id: vehicles.id, name: vehicles.name })
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.vendorId, booking.vendorId)))
    .limit(1)

  if (!vehicle) {
    return { ok: false, error: 'Selected vehicle is not available for this vendor.' }
  }

  // 3. Create the offer record
  const [offer] = await db
    .insert(bookingOffers)
    .values({
      bookingId,
      vehicleId,
      vendorId: booking.vendorId,
      senderId: user.id,
      pricePerDay,
      totalPrice,
      note: note || null,
      status: 'PENDING',
    })
    .returning({ id: bookingOffers.id })

  if (!offer) {
    return { ok: false, error: 'Failed to create offer.' }
  }

  // 4. Link to chat message
  const [thread] = await db
    .select({ id: chatThreads.id })
    .from(chatThreads)
    .where(eq(chatThreads.bookingId, bookingId))
    .limit(1)

  if (thread) {
    const [insertedMsg] = await db.insert(messages).values({
      threadId: thread.id,
      senderId: user.id,
      messageType: 'OFFER',
      offerId: offer.id,
      content: `Proposed changes for ${vehicle.name}`,
    }).returning()

    // Update thread last message time
    await db.update(chatThreads).set({ lastMessageAt: new Date() }).where(eq(chatThreads.id, thread.id))

    // 5. Broadcast to realtime
    if (insertedMsg) {
       const dto: ChatMessageDto = {
         id: insertedMsg.id,
         threadId: insertedMsg.threadId,
         senderId: insertedMsg.senderId,
         content: insertedMsg.content,
         messageType: 'OFFER',
         mediaUrl: null,
         audioDuration: null,
         createdAt: insertedMsg.createdAt.toISOString(),
         editedAt: null,
         deliveredAt: insertedMsg.deliveredAt ? insertedMsg.deliveredAt.toISOString() : null,
         seenAt: null,
         offer: {
            id: offer.id,
            vehicleId,
            vehicleName: vehicle.name,
            pricePerDay,
            totalPrice,
            note: note || null,
            status: 'PENDING',
            senderId: user.id
         }
       }
       void broadcastChatEvent(thread.id, 'INSERT', dtoToBroadcastPayload(dto))
    }
  }

  updateTag(bookingTag(bookingId))
  updateTag(vendorBookingsTag(booking.vendorUserId))
  updateTag(customerBookingsTag(booking.customerUserId))

  return { ok: true, offerId: offer.id }
}

export type AcceptOfferResult =
  | { ok: true }
  | { ok: false; error: string }

export async function acceptOfferFromChat(
  offerId: string
): Promise<AcceptOfferResult> {
  const user = await requireUser()

  const [offer] = await db
    .select()
    .from(bookingOffers)
    .where(and(eq(bookingOffers.id, offerId), eq(bookingOffers.status, 'PENDING')))
    .limit(1)

  if (!offer) {
    return { ok: false, error: 'Offer not found or already responded.' }
  }

  // Ensure the current user is the RECIPIENT of the offer
  if (offer.senderId === user.id) {
    return { ok: false, error: 'You cannot accept your own offer.' }
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, offer.bookingId))
    .limit(1)

  if (!booking || (booking.customerUserId !== user.id && booking.vendorUserId !== user.id)) {
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
      updatedAt: now,
    })
    .where(eq(bookings.id, offer.bookingId))

  updateTag(bookingTag(offer.bookingId))
  updateTag(customerBookingsTag(booking.customerUserId))
  updateTag(vendorBookingsTag(booking.vendorUserId))

  return { ok: true }
}

export type RejectOfferResult =
  | { ok: true }
  | { ok: false; error: string }

export async function rejectOfferFromChat(
  offerId: string
): Promise<RejectOfferResult> {
  const user = await requireUser()

  const [offer] = await db
    .select()
    .from(bookingOffers)
    .where(and(eq(bookingOffers.id, offerId), eq(bookingOffers.status, 'PENDING')))
    .limit(1)

  if (!offer) {
    return { ok: false, error: 'Offer not found or already responded.' }
  }

  // Ensure the current user is the RECIPIENT of the offer
  if (offer.senderId === user.id) {
    return { ok: false, error: 'You cannot reject your own offer.' }
  }

  await db
    .update(bookingOffers)
    .set({ status: 'REJECTED', respondedAt: new Date() })
    .where(eq(bookingOffers.id, offerId))

  updateTag(bookingTag(offer.bookingId))

  return { ok: true }
}

export async function getVendorFleet(bookingId: string) {
  const user = await getRequiredUser()
  
  // Verify user is part of the booking
  const [booking] = await db
    .select({ customerUserId: bookings.customerUserId, vendorUserId: bookings.vendorUserId, vendorId: bookings.vendorId })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1)

  if (!booking || (booking.customerUserId !== user.id && booking.vendorUserId !== user.id)) {
    throw new Error('Not authorized')
  }

  return db
    .select({ id: vehicles.id, name: vehicles.name })
    .from(vehicles)
    .where(and(eq(vehicles.vendorId, booking.vendorId), eq(vehicles.isActive, true)))
}
