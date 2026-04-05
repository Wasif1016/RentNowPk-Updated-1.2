'use server'

import { and, eq, desc, sql } from 'drizzle-orm'
import { getRequiredUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'

export type NotificationRow = {
  id: string
  type: string
  title: string
  body: string | null
  actionUrl: string | null
  isRead: boolean
  createdAt: Date
}

export async function listNotificationsForUser(): Promise<NotificationRow[]> {
  const user = await getRequiredUser()
  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      body: notifications.body,
      actionUrl: notifications.actionUrl,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50)

  return rows
}

export async function markNotificationRead(
  notificationId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getRequiredUser()
  const [updated] = await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, user.id)))
    .returning({ id: notifications.id })

  if (!updated) {
    return { ok: false, error: 'Notification not found.' }
  }
  return { ok: true }
}

export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
  return Number(row?.n ?? 0)
}
