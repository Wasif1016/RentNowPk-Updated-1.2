'use server'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { and, eq, isNull } from 'drizzle-orm'
import { getRequiredUser } from '@/lib/auth/session'
import {
  bookingTag,
  customerBookingsTag,
  unreadMessagesTag,
  vendorBookingsTag,
} from '@/lib/constants/cache-tags'
import {
  getChatContextForBooking,
  loadMessagesPage,
  type ChatMessageDto,
  type MessageCursor,
} from '@/lib/db/chat'
import { db } from '@/lib/db'
import { chatThreads, messages } from '@/lib/db/schema'
import { ChatMessageContentSchema } from '@/lib/validation/chat'

async function requireCustomerOrVendor() {
  const user = await getRequiredUser()
  if (user.role === 'ADMIN') {
    redirect('/admin')
  }
  if (user.role !== 'CUSTOMER' && user.role !== 'VENDOR') {
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
  const ctx = await getChatContextForBooking({
    bookingId,
    userId: user.id,
  })
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

  const now = new Date()
  const [inserted] = await db
    .insert(messages)
    .values({
      threadId: ctx.threadId,
      senderId: user.id,
      content: parsed.data,
      createdAt: now,
    })
    .returning({
      id: messages.id,
      threadId: messages.threadId,
      senderId: messages.senderId,
      content: messages.content,
      createdAt: messages.createdAt,
    })

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

  const dto: ChatMessageDto = {
    id: inserted.id,
    threadId: inserted.threadId,
    senderId: inserted.senderId,
    content: inserted.content,
    createdAt: inserted.createdAt.toISOString(),
    editedAt: null,
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
