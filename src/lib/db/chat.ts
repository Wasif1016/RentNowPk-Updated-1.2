import {
  and,
  desc,
  eq,
  inArray,
  isNull,
  lt,
  or,
  sql,
} from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { db } from '@/lib/db'
import {
  bookingOffers,
  bookings,
  chatThreads,
  messages,
  users,
  vehicles,
  vehicleImages,
} from '@/lib/db/schema'
import { getUnreadCountsByThreadId, getTotalUnreadForUser } from '@/lib/db/chat-unread'

/**
 * Like getChatContextForBooking but also allows ADMIN role — admin bypasses
 * the participant check so they can read/message any thread.
 */
export async function getAdminChatContextForBooking(options: {
  bookingId: string
}): Promise<AdminChatContext | null> {
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
    customerUserId: row.customerUserId,
    vendorUserId: row.vendorUserId,
    customerName: row.customerName ?? 'Customer',
    vendorName: row.vendorName ?? 'Vendor',
  }
}

export type AdminChatContext = {
  threadId: string
  bookingId: string
  status: (typeof bookings.$inferSelect)['status']
  vehicleName: string
  customerUserId: string
  vendorUserId: string
  customerName: string
  vendorName: string
}

export type ChatMessageDto = {
  id: string
  threadId: string
  senderId: string
  content: string | null
  messageType: 'TEXT' | 'AUDIO' | 'OFFER' | 'IMAGE'
  mediaUrl: string | null
  audioDuration: number | null
  createdAt: string
  editedAt: string | null
  deliveredAt: string | null
  seenAt: string | null
  offer?: {
    id: string
    vehicleId: string
    vehicleName: string
    pricePerDay: string
    totalPrice: string
    note: string | null
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
    senderId: string | null
  } | null
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
  pickupAt: Date
  dropoffAt: Date
  pickupAddress: string
  vehicleCoverUrl: string | null
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
      pickupAt: bookings.pickupAt,
      dropoffAt: bookings.dropoffAt,
      pickupAddress: bookings.pickupAddress,
      vehicleCoverUrl: sql<string>`(SELECT url FROM ${vehicleImages} WHERE ${vehicleImages.vehicleId} = ${vehicles.id} AND ${vehicleImages.isCover} = true LIMIT 1)`,
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
    pickupAt: row.pickupAt,
    dropoffAt: row.dropoffAt,
    pickupAddress: row.pickupAddress,
    vehicleCoverUrl: row.vehicleCoverUrl,
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
      messageType: messages.messageType,
      mediaUrl: messages.mediaUrl,
      audioDuration: messages.audioDuration,
      createdAt: messages.createdAt,
      editedAt: messages.editedAt,
      deliveredAt: messages.deliveredAt,
      seenAt: messages.seenAt,
      // Joined offer data
      offerId: bookingOffers.id,
      offerVehicleId: bookingOffers.vehicleId,
      offerVehicleName: vehicles.name,
      offerPricePerDay: bookingOffers.pricePerDay,
      offerTotalPrice: bookingOffers.totalPrice,
      offerNote: bookingOffers.note,
      offerStatus: bookingOffers.status,
      offerSenderId: bookingOffers.senderId,
    })
    .from(messages)
    .leftJoin(bookingOffers, eq(messages.offerId, bookingOffers.id))
    .leftJoin(vehicles, eq(bookingOffers.vehicleId, vehicles.id))
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
      messageType: m.messageType as 'TEXT' | 'AUDIO' | 'OFFER' | 'IMAGE',
      mediaUrl: m.mediaUrl,
      audioDuration: m.audioDuration,
      createdAt: m.createdAt.toISOString(),
      editedAt: m.editedAt ? m.editedAt.toISOString() : null,
      deliveredAt: m.deliveredAt ? m.deliveredAt.toISOString() : null,
      seenAt: m.seenAt ? m.seenAt.toISOString() : null,
      offer: m.offerId ? {
        id: m.offerId,
        vehicleId: m.offerVehicleId!,
        vehicleName: m.offerVehicleName!,
        pricePerDay: m.offerPricePerDay!,
        totalPrice: m.offerTotalPrice!,
        note: m.offerNote,
        status: m.offerStatus!,
        senderId: m.offerSenderId,
      } : null,
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
  otherPartyName: string
  lastMessagePreview: string | null
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
      vendorName: bookingVendor.fullName,
    })
    .from(bookings)
    .innerJoin(chatThreads, eq(chatThreads.bookingId, bookings.id))
    .innerJoin(vehicles, eq(vehicles.id, bookings.vehicleId))
    .innerJoin(bookingVendor, eq(bookingVendor.id, bookings.vendorUserId))
    .where(eq(bookings.customerUserId, customerUserId))
    .orderBy(
      desc(
        sql`COALESCE(${chatThreads.lastMessageAt}, ${bookings.createdAt})`
      )
    )

  const threadIds = rows.map((r) => r.threadId)
  const lastMessages = threadIds.length > 0
    ? await db
        .select({
          threadId: messages.threadId,
          content: messages.content,
          messageType: messages.messageType,
        })
        .from(messages)
        .where(
          and(
            inArray(messages.threadId, threadIds),
            isNull(messages.deletedAt)
          )
        )
        .orderBy(desc(messages.createdAt), desc(messages.id))
    : []

  const lastMessageMap = new Map<string, { type: 'TEXT' | 'AUDIO'; content: string | null }>()
  for (const msg of lastMessages) {
    if (!lastMessageMap.has(msg.threadId)) {
      lastMessageMap.set(msg.threadId, {
        type: msg.messageType as 'TEXT' | 'AUDIO',
        content: msg.content ?? null,
      })
    }
  }

  const mapped = rows.map((r) => {
    const last = lastMessageMap.get(r.threadId)
    let preview: string | null = null
    if (last) {
      if (last.type === 'AUDIO') {
        preview = '🎤 Voice message'
      } else if (last.content) {
        preview = last.content.length > 40 ? last.content.slice(0, 40) + '…' : last.content
      }
    }
    return {
      bookingId: r.bookingId,
      threadId: r.threadId,
      status: r.status,
      pickupAt: r.pickupAt,
      vehicleName: r.vehicleName,
      otherPartyName: r.vendorName?.trim() ?? 'Vendor',
      lastMessagePreview: preview,
      lastMessageAt: r.lastMessageAt,
    }
  })
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
  lastMessagePreview: string | null
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
  const threadIds = rows.map((r) => r.threadId)
  const lastMessages = threadIds.length > 0
    ? await db
        .select({
          threadId: messages.threadId,
          content: messages.content,
          messageType: messages.messageType,
        })
        .from(messages)
        .where(
          and(
            inArray(messages.threadId, threadIds),
            isNull(messages.deletedAt)
          )
        )
        .orderBy(desc(messages.createdAt), desc(messages.id))
    : []

  const lastMessageMap = new Map<string, { type: 'TEXT' | 'AUDIO'; content: string | null }>()
  for (const msg of lastMessages) {
    if (!lastMessageMap.has(msg.threadId)) {
      lastMessageMap.set(msg.threadId, {
        type: msg.messageType as 'TEXT' | 'AUDIO',
        content: msg.content ?? null,
      })
    }
  }

  const customerUnreads = await getUnreadCountsByThreadIdForAdmin(
    rows.map((r) => ({ threadId: r.threadId, userId: r.customerUserId }))
  )
  const vendorUnreads = await getUnreadCountsByThreadIdForAdmin(
    rows.map((r) => ({ threadId: r.threadId, userId: r.vendorUserId }))
  )

  return rows.map((r) => {
    const last = lastMessageMap.get(r.threadId)
    let preview: string | null = null
    if (last) {
      if (last.type === 'AUDIO') {
        preview = '🎤 Voice message'
      } else if (last.content) {
        preview = last.content.length > 40 ? last.content.slice(0, 40) + '…' : last.content
      }
    }
    return {
      bookingId: r.bookingId,
      threadId: r.threadId,
      status: r.status,
      pickupAt: r.pickupAt,
      vehicleName: r.vehicleName,
      customerName: r.customerName ?? '',
      vendorName: r.vendorName ?? '',
      lastMessageAt: r.lastMessageAt,
      lastMessagePreview: preview,
      unreadCustomerCount: customerUnreads.get(r.threadId) ?? 0,
      unreadVendorCount: vendorUnreads.get(r.threadId) ?? 0,
    }
  })
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
      customerName: bookingCustomer.fullName,
    })
    .from(bookings)
    .innerJoin(chatThreads, eq(chatThreads.bookingId, bookings.id))
    .innerJoin(vehicles, eq(vehicles.id, bookings.vehicleId))
    .innerJoin(bookingCustomer, eq(bookingCustomer.id, bookings.customerUserId))
    .where(eq(bookings.vendorUserId, vendorUserId))
    .orderBy(
      desc(
        sql`COALESCE(${chatThreads.lastMessageAt}, ${bookings.createdAt})`
      )
    )

  const threadIds = rows.map((r) => r.threadId)
  const lastMessages = threadIds.length > 0
    ? await db
        .select({
          threadId: messages.threadId,
          content: messages.content,
          messageType: messages.messageType,
        })
        .from(messages)
        .where(
          and(
            inArray(messages.threadId, threadIds),
            isNull(messages.deletedAt)
          )
        )
        .orderBy(desc(messages.createdAt), desc(messages.id))
    : []

  const lastMessageMap = new Map<string, { type: 'TEXT' | 'AUDIO'; content: string | null }>()
  for (const msg of lastMessages) {
    if (!lastMessageMap.has(msg.threadId)) {
      lastMessageMap.set(msg.threadId, {
        type: msg.messageType as 'TEXT' | 'AUDIO',
        content: msg.content ?? null,
      })
    }
  }

  const mapped = rows.map((r) => {
    const last = lastMessageMap.get(r.threadId)
    let preview: string | null = null
    if (last) {
      if (last.type === 'AUDIO') {
        preview = '🎤 Voice message'
      } else if (last.content) {
        preview = last.content.length > 40 ? last.content.slice(0, 40) + '…' : last.content
      }
    }
    return {
      bookingId: r.bookingId,
      threadId: r.threadId,
      status: r.status,
      pickupAt: r.pickupAt,
      vehicleName: r.vehicleName,
      otherPartyName: r.customerName?.trim() ?? 'Customer',
      lastMessagePreview: preview,
      lastMessageAt: r.lastMessageAt,
    }
  })
  const unread = await getUnreadCountsByThreadId(
    vendorUserId,
    mapped.map((m) => m.threadId)
  )
  return mapped.map((r) => ({
    ...r,
    unreadCount: unread.get(r.threadId) ?? 0,
  }))
}

export async function getUnreadCountsByThreadIdForAdmin(
  pairs: { threadId: string; userId: string }[]
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  for (const { threadId, userId } of pairs) {
    out.set(threadId, await getTotalUnreadForUser(userId))
  }
  return out
}

export async function getVendorFleetForBooking(bookingId: string): Promise<{ id: string, name: string }[]> {
  const [row] = await db
    .select({ vendorId: bookings.vendorId })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1)

  if (!row) return []

  return db
    .select({ id: vehicles.id, name: vehicles.name })
    .from(vehicles)
    .where(and(eq(vehicles.vendorId, row.vendorId), eq(vehicles.isActive, true)))
}
