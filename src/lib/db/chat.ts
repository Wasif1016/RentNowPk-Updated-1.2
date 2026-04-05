import {
  and,
  desc,
  eq,
  isNull,
  lt,
  or,
  sql,
} from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { db } from '@/lib/db'
import {
  bookings,
  chatThreads,
  messages,
  users,
  vehicles,
} from '@/lib/db/schema'
import { getUnreadCountsByThreadId, getTotalUnreadForUser } from '@/lib/db/chat-unread'

/**
 * Like getChatContextForBooking but also allows ADMIN role — admin bypasses
 * the participant check so they can read/message any thread.
 */
export async function getAdminChatContextForBooking(options: {
  bookingId: string
}): Promise<BookingChatContext | null> {
  const [row] = await db
    .select({
      threadId: chatThreads.id,
      bookingId: bookings.id,
      status: bookings.status,
      vehicleName: vehicles.name,
      customerUserId: bookings.customerUserId,
      vendorUserId: bookings.vendorUserId,
      customerName: bookingCustomer.fullName,
      vendorName: bookingVendor.fullName,
    })
    .from(bookings)
    .innerJoin(chatThreads, eq(chatThreads.bookingId, bookings.id))
    .innerJoin(vehicles, eq(vehicles.id, bookings.vehicleId))
    .innerJoin(bookingCustomer, eq(bookingCustomer.id, bookings.customerUserId))
    .innerJoin(bookingVendor, eq(bookingVendor.id, bookings.vendorUserId))
    .where(eq(bookings.id, options.bookingId))
    .limit(1)

  if (!row) return null

  return {
    threadId: row.threadId,
    bookingId: row.bookingId,
    status: row.status,
    vehicleName: row.vehicleName,
    otherPartyName: row.customerName, // admin doesn't have a "other party"
    isCustomer: false,
    customerUserId: row.customerUserId,
    vendorUserId: row.vendorUserId,
  }
}

export type ChatMessageDto = {
  id: string
  threadId: string
  senderId: string
  content: string
  createdAt: string
  editedAt: string | null
  deliveredAt: string | null
  seenAt: string | null
}

export type MessageCursor = {
  createdAt: string
  id: string
}

export type BookingChatContext = {
  threadId: string
  bookingId: string
  status: (typeof bookings.$inferSelect)['status']
  vehicleName: string
  otherPartyName: string
  isCustomer: boolean
  customerUserId: string
  vendorUserId: string
}

const bookingCustomer = alias(users, 'booking_customer')
const bookingVendor = alias(users, 'booking_vendor')

/** Customer or vendor must be a participant on the booking thread. */
export async function getChatContextForBooking(options: {
  bookingId: string
  userId: string
}): Promise<BookingChatContext | null> {
  const [row] = await db
    .select({
      threadId: chatThreads.id,
      bookingId: bookings.id,
      status: bookings.status,
      vehicleName: vehicles.name,
      customerUserId: bookings.customerUserId,
      vendorUserId: bookings.vendorUserId,
      customerName: bookingCustomer.fullName,
      vendorName: bookingVendor.fullName,
    })
    .from(bookings)
    .innerJoin(chatThreads, eq(chatThreads.bookingId, bookings.id))
    .innerJoin(vehicles, eq(vehicles.id, bookings.vehicleId))
    .innerJoin(bookingCustomer, eq(bookingCustomer.id, bookings.customerUserId))
    .innerJoin(bookingVendor, eq(bookingVendor.id, bookings.vendorUserId))
    .where(
      and(
        eq(bookings.id, options.bookingId),
        or(
          eq(bookings.customerUserId, options.userId),
          eq(bookings.vendorUserId, options.userId)
        )
      )
    )
    .limit(1)

  if (!row) return null

  const isCustomer = row.customerUserId === options.userId
  return {
    threadId: row.threadId,
    bookingId: row.bookingId,
    status: row.status,
    vehicleName: row.vehicleName,
    otherPartyName: isCustomer ? row.vendorName : row.customerName,
    isCustomer,
    customerUserId: row.customerUserId,
    vendorUserId: row.vendorUserId,
  }
}

const PAGE = 50

export async function loadMessagesPage(
  threadId: string,
  cursor?: MessageCursor | null
): Promise<{ messages: ChatMessageDto[]; nextCursor: MessageCursor | null }> {
  const cursorDate = cursor ? new Date(cursor.createdAt) : null
  const conditions = [
    eq(messages.threadId, threadId),
    isNull(messages.deletedAt),
  ]
  if (cursor && cursorDate && !Number.isNaN(cursorDate.getTime())) {
    conditions.push(
      or(
        lt(messages.createdAt, cursorDate),
        and(
          eq(messages.createdAt, cursorDate),
          lt(messages.id, cursor.id)
        )
      )!
    )
  }

  const rows = await db
    .select({
      id: messages.id,
      threadId: messages.threadId,
      senderId: messages.senderId,
      content: messages.content,
      createdAt: messages.createdAt,
      editedAt: messages.editedAt,
      deliveredAt: messages.deliveredAt,
      seenAt: messages.seenAt,
    })
    .from(messages)
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt), desc(messages.id))
    .limit(PAGE + 1)

  const hasMore = rows.length > PAGE
  const slice = hasMore ? rows.slice(0, PAGE) : rows
  const chronological = [...slice].reverse()

  const nextCursor =
    hasMore && chronological.length > 0
      ? {
          createdAt: chronological[0]!.createdAt.toISOString(),
          id: chronological[0]!.id,
        }
      : null

  return {
    messages: chronological.map((m) => ({
      id: m.id,
      threadId: m.threadId,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      editedAt: m.editedAt ? m.editedAt.toISOString() : null,
      deliveredAt: m.deliveredAt ? m.deliveredAt.toISOString() : null,
      seenAt: m.seenAt ? m.seenAt.toISOString() : null,
    })),
    nextCursor,
  }
}

export type BookingListRow = {
  bookingId: string
  threadId: string
  status: (typeof bookings.$inferSelect)['status']
  pickupAt: Date
  vehicleName: string
  lastMessageAt: Date | null
  unreadCount: number
}

export async function listBookingChatsForCustomer(
  customerUserId: string
): Promise<BookingListRow[]> {
  const rows = await db
    .select({
      bookingId: bookings.id,
      threadId: chatThreads.id,
      status: bookings.status,
      pickupAt: bookings.pickupAt,
      vehicleName: vehicles.name,
      lastMessageAt: chatThreads.lastMessageAt,
    })
    .from(bookings)
    .innerJoin(chatThreads, eq(chatThreads.bookingId, bookings.id))
    .innerJoin(vehicles, eq(vehicles.id, bookings.vehicleId))
    .where(eq(bookings.customerUserId, customerUserId))
    .orderBy(
      desc(
        sql`COALESCE(${chatThreads.lastMessageAt}, ${bookings.createdAt})`
      )
    )

  const mapped = rows.map((r) => ({
    bookingId: r.bookingId,
    threadId: r.threadId,
    status: r.status,
    pickupAt: r.pickupAt,
    vehicleName: r.vehicleName,
    lastMessageAt: r.lastMessageAt,
  }))
  const unread = await getUnreadCountsByThreadId(
    customerUserId,
    mapped.map((m) => m.threadId)
  )
  return mapped.map((r) => ({
    ...r,
    unreadCount: unread.get(r.threadId) ?? 0,
  }))
}

export type AdminChatListRow = {
  bookingId: string
  threadId: string
  status: (typeof bookings.$inferSelect)['status']
  pickupAt: Date
  vehicleName: string
  customerName: string
  vendorName: string
  lastMessageAt: Date | null
  unreadCustomerCount: number
  unreadVendorCount: number
}

export async function listBookingChatsForAdmin(): Promise<AdminChatListRow[]> {
  const rows = await db
    .select({
      bookingId: bookings.id,
      threadId: chatThreads.id,
      status: bookings.status,
      pickupAt: bookings.pickupAt,
      vehicleName: vehicles.name,
      customerName: bookingCustomer.fullName,
      vendorName: bookingVendor.fullName,
      lastMessageAt: chatThreads.lastMessageAt,
      customerUserId: bookings.customerUserId,
      vendorUserId: bookings.vendorUserId,
    })
    .from(bookings)
    .innerJoin(chatThreads, eq(chatThreads.bookingId, bookings.id))
    .innerJoin(vehicles, eq(vehicles.id, bookings.vehicleId))
    .innerJoin(bookingCustomer, eq(bookingCustomer.id, bookings.customerUserId))
    .innerJoin(bookingVendor, eq(bookingVendor.id, bookings.vendorUserId))
    .orderBy(desc(sql`COALESCE(${chatThreads.lastMessageAt}, ${bookings.createdAt})`))

  const customerUnreads = await getUnreadCountsByThreadIdForAdmin(
    rows.map((r) => ({ threadId: r.threadId, userId: r.customerUserId }))
  )
  const vendorUnreads = await getUnreadCountsByThreadIdForAdmin(
    rows.map((r) => ({ threadId: r.threadId, userId: r.vendorUserId }))
  )

  return rows.map((r) => ({
    bookingId: r.bookingId,
    threadId: r.threadId,
    status: r.status,
    pickupAt: r.pickupAt,
    vehicleName: r.vehicleName,
    customerName: r.customerName ?? '',
    vendorName: r.vendorName ?? '',
    lastMessageAt: r.lastMessageAt,
    unreadCustomerCount: customerUnreads.get(r.threadId) ?? 0,
    unreadVendorCount: vendorUnreads.get(r.threadId) ?? 0,
  }))
}

export async function listBookingChatsForVendor(
  vendorUserId: string
): Promise<BookingListRow[]> {
  const rows = await db
    .select({
      bookingId: bookings.id,
      threadId: chatThreads.id,
      status: bookings.status,
      pickupAt: bookings.pickupAt,
      vehicleName: vehicles.name,
      lastMessageAt: chatThreads.lastMessageAt,
    })
    .from(bookings)
    .innerJoin(chatThreads, eq(chatThreads.bookingId, bookings.id))
    .innerJoin(vehicles, eq(vehicles.id, bookings.vehicleId))
    .where(eq(bookings.vendorUserId, vendorUserId))
    .orderBy(
      desc(
        sql`COALESCE(${chatThreads.lastMessageAt}, ${bookings.createdAt})`
      )
    )

  const mapped = rows.map((r) => ({
    bookingId: r.bookingId,
    threadId: r.threadId,
    status: r.status,
    pickupAt: r.pickupAt,
    vehicleName: r.vehicleName,
    lastMessageAt: r.lastMessageAt,
  }))
  const unread = await getUnreadCountsByThreadId(
    vendorUserId,
    mapped.map((m) => m.threadId)
  )
  return mapped.map((r) => ({
    ...r,
    unreadCount: unread.get(r.threadId) ?? 0,
  }))
}

async function getUnreadCountsByThreadIdForAdmin(
  pairs: { threadId: string; userId: string }[]
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  for (const { threadId, userId } of pairs) {
    out.set(threadId, await getTotalUnreadForUser(userId))
  }
  return out
}
