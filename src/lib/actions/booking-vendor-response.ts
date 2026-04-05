'use server'

import { updateTag } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { getRequiredUser } from '@/lib/auth/session'
import {
  bookingTag,
  customerBookingsTag,
  unreadMessagesTag,
  vendorBookingsTag,
} from '@/lib/constants/cache-tags'
import { db } from '@/lib/db'
import { bookings, chatThreads, messages } from '@/lib/db/schema'
import { z } from 'zod'

const RejectReasonSchema = z
  .string()
  .trim()
  .min(3, 'Please enter a short reason.')
  .max(500, 'Reason is too long.')

export type VendorBookingResponseResult =
  | { ok: true }
  | { ok: false; error: string }

async function assertVendorOwnsPendingBooking(bookingId: string, vendorUserId: string) {
  const [row] = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      threadId: chatThreads.id,
      customerUserId: bookings.customerUserId,
    })
    .from(bookings)
    .innerJoin(chatThreads, eq(chatThreads.bookingId, bookings.id))
    .where(
      and(eq(bookings.id, bookingId), eq(bookings.vendorUserId, vendorUserId))
    )
    .limit(1)

  if (!row) {
    return { ok: false as const, error: 'Booking not found.' }
  }
  if (row.status !== 'PENDING') {
    return { ok: false as const, error: 'This booking is no longer pending.' }
  }
  return {
    ok: true as const,
    threadId: row.threadId,
    customerUserId: row.customerUserId,
  }
}

export async function vendorAcceptBooking(
  bookingId: string
): Promise<VendorBookingResponseResult> {
  const user = await getRequiredUser('VENDOR')
  const gate = await assertVendorOwnsPendingBooking(bookingId, user.id)
  if (!gate.ok) return gate

  const now = new Date()
  const content =
    'Booking accepted. The request is confirmed — you can continue planning details in this chat.'

  await db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({
        status: 'CONFIRMED',
        updatedAt: now,
      })
      .where(eq(bookings.id, bookingId))

    await tx.insert(messages).values({
      threadId: gate.threadId,
      senderId: user.id,
      content,
      createdAt: now,
    })

    await tx
      .update(chatThreads)
      .set({ lastMessageAt: now })
      .where(eq(chatThreads.id, gate.threadId))
  })

  updateTag(bookingTag(bookingId))
  updateTag(customerBookingsTag(gate.customerUserId))
  updateTag(vendorBookingsTag(user.id))
  updateTag(unreadMessagesTag(gate.customerUserId))

  return { ok: true }
}

export async function vendorRejectBooking(
  bookingId: string,
  rawReason: string
): Promise<VendorBookingResponseResult> {
  const user = await getRequiredUser('VENDOR')
  const parsed = RejectReasonSchema.safeParse(rawReason)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid reason.' }
  }

  const gate = await assertVendorOwnsPendingBooking(bookingId, user.id)
  if (!gate.ok) return gate

  const now = new Date()
  const content = `Booking declined.\nReason: ${parsed.data}`

  await db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({
        status: 'REJECTED',
        updatedAt: now,
      })
      .where(eq(bookings.id, bookingId))

    await tx.insert(messages).values({
      threadId: gate.threadId,
      senderId: user.id,
      content,
      createdAt: now,
    })

    await tx
      .update(chatThreads)
      .set({ lastMessageAt: now })
      .where(eq(chatThreads.id, gate.threadId))
  })

  updateTag(bookingTag(bookingId))
  updateTag(customerBookingsTag(gate.customerUserId))
  updateTag(vendorBookingsTag(user.id))
  updateTag(unreadMessagesTag(gate.customerUserId))

  return { ok: true }
}
