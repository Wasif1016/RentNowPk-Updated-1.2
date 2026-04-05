import { and, eq, inArray, isNull, ne, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  chatThreadParticipantReadState,
  chatThreads,
  messages,
} from '@/lib/db/schema'

let warnedMissingReadStateTable = false

function warnMissingReadStateTableOnce() {
  if (process.env.NODE_ENV !== 'development' || warnedMissingReadStateTable) return
  warnedMissingReadStateTable = true
  console.warn(
    '[rentnowpk] Table chat_thread_participant_read_state is missing. Run `pnpm db:migrate` against the same DATABASE_URL as the app. Using inbound-message fallback for unread counts until then.'
  )
}

/** Postgres undefined_table — migration not applied to this database. */
function isMissingChatReadStateRelation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const any = error as { code?: string; cause?: unknown; message?: string }
  if (any.code === '42P01') return true
  if (any.cause && typeof any.cause === 'object') {
    const c = any.cause as { code?: string }
    if (c.code === '42P01') return true
  }
  const msg = any.message ?? String(error)
  return (
    msg.includes('chat_thread_participant_read_state') &&
    (msg.includes('does not exist') || msg.includes('42P01'))
  )
}

/**
 * All inbound messages in participant threads (same as “never read” when read_state is absent).
 * Used when migration 0008 has not been applied to this DATABASE_URL.
 */
async function getTotalUnreadInboundOnly(userId: string): Promise<number> {
  const [row] = await db
    .select({
      n: sql<number>`count(*)::int`,
    })
    .from(messages)
    .innerJoin(chatThreads, eq(messages.threadId, chatThreads.id))
    .where(
      and(
        or(
          eq(chatThreads.customerUserId, userId),
          eq(chatThreads.vendorUserId, userId)
        ),
        ne(messages.senderId, userId),
        isNull(messages.deletedAt)
      )
    )
  return Number(row?.n ?? 0)
}

async function getUnreadCountsInboundOnlyByThreadId(
  userId: string,
  threadIds: string[]
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (threadIds.length === 0) return out

  const rows = await db
    .select({
      threadId: messages.threadId,
      n: sql<number>`count(*)::int`,
    })
    .from(messages)
    .innerJoin(chatThreads, eq(messages.threadId, chatThreads.id))
    .where(
      and(
        inArray(messages.threadId, threadIds),
        or(
          eq(chatThreads.customerUserId, userId),
          eq(chatThreads.vendorUserId, userId)
        ),
        ne(messages.senderId, userId),
        isNull(messages.deletedAt)
      )
    )
    .groupBy(messages.threadId)

  for (const r of rows) {
    out.set(r.threadId, Number(r.n))
  }
  return out
}

/** Inbound messages newer than the user's read cursor (never read => all inbound). */
export async function getTotalUnreadForUser(userId: string): Promise<number> {
  try {
    const [row] = await db
      .select({
        n: sql<number>`count(*)::int`,
      })
      .from(messages)
      .innerJoin(chatThreads, eq(messages.threadId, chatThreads.id))
      .leftJoin(
        chatThreadParticipantReadState,
        and(
          eq(chatThreadParticipantReadState.threadId, messages.threadId),
          eq(chatThreadParticipantReadState.userId, userId)
        )
      )
      .where(
        and(
          or(
            eq(chatThreads.customerUserId, userId),
            eq(chatThreads.vendorUserId, userId)
          ),
          ne(messages.senderId, userId),
          isNull(messages.deletedAt),
          sql`${messages.createdAt} > COALESCE(${chatThreadParticipantReadState.lastReadAt}, '-infinity'::timestamptz)`
        )
      )

    return Number(row?.n ?? 0)
  } catch (e) {
    if (!isMissingChatReadStateRelation(e)) throw e
    warnMissingReadStateTableOnce()
    return getTotalUnreadInboundOnly(userId)
  }
}

export async function getUnreadCountsByThreadId(
  userId: string,
  threadIds: string[]
): Promise<Map<string, number>> {
  try {
    const out = new Map<string, number>()
    if (threadIds.length === 0) return out

    const rows = await db
      .select({
        threadId: messages.threadId,
        n: sql<number>`count(*)::int`,
      })
      .from(messages)
      .innerJoin(chatThreads, eq(messages.threadId, chatThreads.id))
      .leftJoin(
        chatThreadParticipantReadState,
        and(
          eq(chatThreadParticipantReadState.threadId, messages.threadId),
          eq(chatThreadParticipantReadState.userId, userId)
        )
      )
      .where(
        and(
          inArray(messages.threadId, threadIds),
          or(
            eq(chatThreads.customerUserId, userId),
            eq(chatThreads.vendorUserId, userId)
          ),
          ne(messages.senderId, userId),
          isNull(messages.deletedAt),
          sql`${messages.createdAt} > COALESCE(${chatThreadParticipantReadState.lastReadAt}, '-infinity'::timestamptz)`
        )
      )
      .groupBy(messages.threadId)

    for (const r of rows) {
      out.set(r.threadId, Number(r.n))
    }
    return out
  } catch (e) {
    if (!isMissingChatReadStateRelation(e)) throw e
    warnMissingReadStateTableOnce()
    return getUnreadCountsInboundOnlyByThreadId(userId, threadIds)
  }
}

/**
 * Sets read cursor to the latest non-deleted message time in the thread (or now if empty).
 * Also writes seen_at on all non-own delivered messages that haven't been seen yet,
 * completing the read-receipt tick-mark chain.
 */
export async function upsertLastReadToNow(
  threadId: string,
  userId: string
): Promise<void> {
  const [mx] = await db
    .select({
      maxAt: sql<Date | null>`max(${messages.createdAt})`,
    })
    .from(messages)
    .where(and(eq(messages.threadId, threadId), isNull(messages.deletedAt)))

  const at = mx?.maxAt ? new Date(mx.maxAt) : new Date()
  const now = new Date()

  try {
    await db
      .insert(chatThreadParticipantReadState)
      .values({
        threadId,
        userId,
        lastReadAt: at,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          chatThreadParticipantReadState.threadId,
          chatThreadParticipantReadState.userId,
        ],
        set: {
          lastReadAt: at,
          updatedAt: now,
        },
      })

    // Mark all messages from the OTHER party as "seen" — these drive tick marks
    await db
      .update(messages)
      .set({ seenAt: now })
      .where(
        and(
          eq(messages.threadId, threadId),
          ne(messages.senderId, userId),
          isNull(messages.seenAt),
          isNull(messages.deletedAt)
        )
      )
  } catch (e) {
    if (isMissingChatReadStateRelation(e)) {
      warnMissingReadStateTableOnce()
      return
    }
    throw e
  }
}
