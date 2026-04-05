'use server'

import { refresh, revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getRequiredUser } from '@/lib/auth/session'
import { getChatContextForBooking } from '@/lib/db/chat'
import { upsertLastReadToNow } from '@/lib/db/chat-unread'

export type MarkThreadReadResult = { ok: true } | { ok: false; error: string }

export async function markThreadRead(bookingId: string): Promise<MarkThreadReadResult> {
  const user = await getRequiredUser()
  if (user.role === 'ADMIN') {
    redirect('/admin')
  }
  if (user.role !== 'CUSTOMER' && user.role !== 'VENDOR') {
    redirect('/auth/login')
  }

  const ctx = await getChatContextForBooking({
    bookingId,
    userId: user.id,
  })
  if (!ctx) {
    return { ok: false, error: 'Chat not found.' }
  }

  await upsertLastReadToNow(ctx.threadId, user.id)

  revalidatePath('/customer', 'layout')
  revalidatePath('/vendor', 'layout')
  refresh()

  return { ok: true }
}
