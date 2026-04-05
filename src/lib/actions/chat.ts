'use server'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { getRequiredUser } from '@/lib/auth/session'
import {
  bookingTag,
  customerBookingsTag,
  unreadMessagesTag,
  vendorBookingsTag,
} from '@/lib/constants/cache-tags'
import {
  getChatContextForBooking,
  getAdminChatContextForBooking,
  loadMessagesPage,
  type ChatMessageDto,
  type MessageCursor,
} from '@/lib/db/chat'
import { db } from '@/lib/db'
import { bookings, chatThreads, incidents, messages, messageReactions, notifications, users } from '@/lib/db/schema'
import { ChatMessageContentSchema } from '@/lib/validation/chat'

type ContactLeakType = 'PHONE_NUMBER' | 'EMAIL_ADDRESS' | 'SOCIAL_HANDLE'

function isContactLeak(content: string): { type: ContactLeakType; match: string } | null {
  const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi
  const socialPattern = /@[a-zA-Z0-9_]{2,}/g

  const phoneMatch = phonePattern.exec(content)
  if (phoneMatch) return { type: 'PHONE_NUMBER', match: phoneMatch[0] }

  const emailMatch = emailPattern.exec(content)
  if (emailMatch) return { type: 'EMAIL_ADDRESS', match: emailMatch[0] }

  const socialMatch = socialPattern.exec(content)
  if (socialMatch) return { type: 'SOCIAL_HANDLE', match: socialMatch[0] }

  return null
}

async function requireCustomerOrVendor() {
  const user = await getRequiredUser()
  if (user.role !== 'CUSTOMER' && user.role !== 'VENDOR' && user.role !== 'ADMIN') {
    redirect('/auth/login')
  }
  return user
}

export async function fetchChatMessages(
  bookingId: string,
  cursor?: MessageCursor | null
): Promise<
  | { ok: true; messages: ChatMessageDto[]; nextCursor: MessageCursor | null }
  | { ok: false; error: string }
> {
  const user = await requireCustomerOrVendor()

  // Admin uses a separate context getter that bypasses participant check
  const ctx =
    user.role === 'ADMIN'
      ? await getAdminChatContextForBooking({ bookingId })
      : await getChatContextForBooking({ bookingId, userId: user.id })

  if (!ctx) {
    return { ok: false, error: 'Chat not found.' }
  }
  const page = await loadMessagesPage(ctx.threadId, cursor ?? undefined)
  return { ok: true, messages: page.messages, nextCursor: page.nextCursor }
}

export type SendChatMessageResult =
  | { ok: true; message: ChatMessageDto }
  | { ok: false; error: string }

export async function sendChatMessage(
  bookingId: string,
  rawContent: string
): Promise<SendChatMessageResult> {
  const user = await requireCustomerOrVendor()
  const parsed = ChatMessageContentSchema.safeParse(rawContent)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid message.' }
  }

  const ctx = await getChatContextForBooking({
    bookingId,
    userId: user.id,
  })
  if (!ctx) {
    return { ok: false, error: 'Chat not found.' }
  }

  // Contact-leak detection: only applies before booking is confirmed
  let blockedByContactRule = false
  if (ctx.status !== 'CONFIRMED') {
    const leak = isContactLeak(parsed.data)
    if (leak) {
      blockedByContactRule = true
      // Insert incident record
      await db.insert(incidents).values({
        userId: user.id,
        incidentType: leak.type,
        rawContent: parsed.data,
      })
    }
  }

  const now = new Date()
  const [inserted] = await db
    .insert(messages)
    .values({
      threadId: ctx.threadId,
      senderId: user.id,
      content: parsed.data,
      createdAt: now,
      blockedByContactRule,
    })
    .returning({
      id: messages.id,
      threadId: messages.threadId,
      senderId: messages.senderId,
      content: messages.content,
      createdAt: messages.createdAt,
      deliveredAt: messages.deliveredAt,
      seenAt: messages.seenAt,
    })

  // If blocked by contact rule, do not notify recipient or bump thread
  if (blockedByContactRule) {
    return {
      ok: false,
      error:
        'Your message was hidden because it may contain contact information. This is not allowed before the booking is confirmed.',
    }
  }

  await db
    .update(chatThreads)
    .set({ lastMessageAt: now })
    .where(eq(chatThreads.id, ctx.threadId))

  updateTag(bookingTag(bookingId))
  updateTag(customerBookingsTag(ctx.customerUserId))
  updateTag(vendorBookingsTag(ctx.vendorUserId))

  const recipientUserId =
    user.id === ctx.customerUserId ? ctx.vendorUserId : ctx.customerUserId
  updateTag(unreadMessagesTag(recipientUserId))

  // Insert in-app notification for the recipient
  await db.insert(notifications).values({
    userId: recipientUserId,
    type: 'MESSAGE',
    title: 'New message',
    body: parsed.data.slice(0, 80),
    actionUrl: `/customer/chat/${bookingId}`,
    sentInApp: true,
    entityType: 'messages',
    entityId: inserted.id,
  })

  const dto: ChatMessageDto = {
    id: inserted.id,
    threadId: inserted.threadId,
    senderId: inserted.senderId,
    content: inserted.content,
    createdAt: inserted.createdAt.toISOString(),
    editedAt: null,
    deliveredAt: inserted.deliveredAt ? inserted.deliveredAt.toISOString() : null,
    seenAt: inserted.seenAt ? inserted.seenAt.toISOString() : null,
  }
  return { ok: true, message: dto }
}

export type EditChatMessageResult =
  | { ok: true; message: ChatMessageDto }
  | { ok: false; error: string }

export async function editChatMessage(
  bookingId: string,
  messageId: string,
  rawContent: string
): Promise<EditChatMessageResult> {
  const user = await requireCustomerOrVendor()
  const parsed = ChatMessageContentSchema.safeParse(rawContent)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid message.' }
  }

  const ctx = await getChatContextForBooking({ bookingId, userId: user.id })
  if (!ctx) {
    return { ok: false, error: 'Chat not found.' }
  }

  const now = new Date()

  const [updated] = await db
    .update(messages)
    .set({ content: parsed.data, editedAt: now })
    .where(
      and(
        eq(messages.id, messageId),
        eq(messages.threadId, ctx.threadId),
        eq(messages.senderId, user.id),
        isNull(messages.deletedAt)
      )
    )
    .returning({
      id: messages.id,
      threadId: messages.threadId,
      senderId: messages.senderId,
      content: messages.content,
      createdAt: messages.createdAt,
      editedAt: messages.editedAt,
    })

  if (!updated) {
    return { ok: false, error: 'Message not found or cannot be edited.' }
  }

  updateTag(bookingTag(bookingId))
  updateTag(customerBookingsTag(ctx.customerUserId))
  updateTag(vendorBookingsTag(ctx.vendorUserId))

  return {
    ok: true,
    message: {
      id: updated.id,
      threadId: updated.threadId,
      senderId: updated.senderId,
      content: updated.content,
      createdAt: updated.createdAt.toISOString(),
      editedAt: updated.editedAt ? updated.editedAt.toISOString() : null,
      deliveredAt: null,
      seenAt: null,
    },
  }
}

export type DeleteChatMessageResult =
  | { ok: true }
  | { ok: false; error: string }

export async function deleteChatMessage(
  bookingId: string,
  messageId: string
): Promise<DeleteChatMessageResult> {
  const user = await requireCustomerOrVendor()
  const ctx = await getChatContextForBooking({ bookingId, userId: user.id })
  if (!ctx) {
    return { ok: false, error: 'Chat not found.' }
  }

  const [updated] = await db
    .update(messages)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(messages.id, messageId),
        eq(messages.threadId, ctx.threadId),
        eq(messages.senderId, user.id),
        isNull(messages.deletedAt)
      )
    )
    .returning({ id: messages.id })

  if (!updated) {
    return { ok: false, error: 'Message not found or already deleted.' }
  }

  updateTag(bookingTag(bookingId))
  updateTag(customerBookingsTag(ctx.customerUserId))
  updateTag(vendorBookingsTag(ctx.vendorUserId))

  return { ok: true }
}

export type ToggleReactionResult =
  | { ok: true; reacted: boolean }
  | { ok: false; error: string }

const VALID_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'] as const
type ValidEmoji = (typeof VALID_EMOJIS)[number]

/**
 * Toggle a reaction on a message. If the user already reacted with this emoji,
 * it removes the reaction. Otherwise it adds it.
 */
export async function toggleReaction(
  bookingId: string,
  messageId: string,
  emoji: string
): Promise<ToggleReactionResult> {
  const user = await requireCustomerOrVendor()

  if (!VALID_EMOJIS.includes(emoji as ValidEmoji)) {
    return { ok: false, error: 'Invalid emoji.' }
  }

  const ctx = await getChatContextForBooking({ bookingId, userId: user.id })
  if (!ctx) {
    return { ok: false, error: 'Chat not found.' }
  }

  // Check if reaction already exists
  const [existing] = await db
    .select({ id: messageReactions.id })
    .from(messageReactions)
    .where(
      and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, user.id),
        eq(messageReactions.emoji, emoji)
      )
    )

  if (existing) {
    // Remove reaction
    await db
      .delete(messageReactions)
      .where(eq(messageReactions.id, existing.id))
    return { ok: true, reacted: false }
  }

  // Add reaction
  await db
    .insert(messageReactions)
    .values({ messageId, userId: user.id, emoji })

  return { ok: true, reacted: true }
}

export type ReactionSummary = {
  emoji: string
  count: number
  reacted: boolean
}

export async function getReactionsForThread(
  threadId: string,
  currentUserId: string
): Promise<ReactionSummary[]> {
  const rows = await db
    .select({
      emoji: messageReactions.emoji,
      n: sql<number>`count(*)::int`,
      hasMine: sql<boolean>`bool_or(${messageReactions.userId} = ${currentUserId})`,
    })
    .from(messageReactions)
    .innerJoin(messages, eq(messageReactions.messageId, messages.id))
    .where(eq(messages.threadId, threadId))
    .groupBy(messageReactions.emoji)

  return rows.map((r) => ({
    emoji: r.emoji,
    count: Number(r.n),
    reacted: r.hasMine,
  }))
}

/**
 * Admin sends a message on behalf of a thread participant.
 * adminId is the actual admin user; content is the admin's message.
 * The senderId is set to the admin's own ID so the message is correctly attributed.
 */
export async function adminSendChatMessage(
  bookingId: string,
  rawContent: string
): Promise<SendChatMessageResult> {
  const user = await getRequiredUser('ADMIN')

  const parsed = ChatMessageContentSchema.safeParse(rawContent)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid message.' }
  }

  const ctx = await getAdminChatContextForBooking({ bookingId })
  if (!ctx) {
    return { ok: false, error: 'Chat not found.' }
  }

  const now = new Date()
  const [inserted] = await db
    .insert(messages)
    .values({
      threadId: ctx.threadId,
      senderId: user.id, // admin as sender
      content: parsed.data,
      createdAt: now,
    })
    .returning({
      id: messages.id,
      threadId: messages.threadId,
      senderId: messages.senderId,
      content: messages.content,
      createdAt: messages.createdAt,
      deliveredAt: messages.deliveredAt,
      seenAt: messages.seenAt,
    })

  await db
    .update(chatThreads)
    .set({ lastMessageAt: now })
    .where(eq(chatThreads.id, ctx.threadId))

  updateTag(bookingTag(bookingId))
  updateTag(customerBookingsTag(ctx.customerUserId))
  updateTag(vendorBookingsTag(ctx.vendorUserId))
  updateTag(unreadMessagesTag(ctx.customerUserId))
  updateTag(unreadMessagesTag(ctx.vendorUserId))

  const dto: ChatMessageDto = {
    id: inserted.id,
    threadId: inserted.threadId,
    senderId: inserted.senderId,
    content: inserted.content,
    createdAt: inserted.createdAt.toISOString(),
    editedAt: null,
    deliveredAt: inserted.deliveredAt ? inserted.deliveredAt.toISOString() : null,
    seenAt: inserted.seenAt ? inserted.seenAt.toISOString() : null,
  }
  return { ok: true, message: dto }
}
