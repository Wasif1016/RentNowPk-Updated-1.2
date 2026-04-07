'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getRequiredUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { formString } from '@/lib/form/form-data'
import { createClient } from '@/lib/supabase/server'

const fullNameSchema = z
  .string()
  .transform((s) => s.trim())
  .refine((s) => s.length > 0, { message: 'Enter your name.' })
  .refine((s) => s.length <= 200, { message: 'Name is too long.' })

const emailChangeSchema = z.object({
  email: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(
      z
        .string()
        .min(1, 'Enter your email address.')
        .email('Enter a valid email address.')
    ),
})

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters.' })
      .max(128, { message: 'Password is too long.' }),
    confirmNewPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'New passwords do not match.',
    path: ['confirmNewPassword'],
  })

export type AdminNameFieldKey = 'fullName'
export type AdminNameResult =
  | { ok: true }
  | { ok: false; fieldErrors?: Partial<Record<AdminNameFieldKey, string>>; formError?: string }

export type AdminEmailFieldKey = 'email'
export type AdminEmailResult =
  | { ok: true; pendingConfirmation: true }
  | { ok: false; fieldErrors?: Partial<Record<AdminEmailFieldKey, string>>; formError?: string }

export type AdminPasswordFieldKey = 'currentPassword' | 'newPassword' | 'confirmNewPassword'
export type AdminPasswordResult =
  | { ok: true }
  | { ok: false; fieldErrors?: Partial<Record<AdminPasswordFieldKey, string>>; formError?: string }

function zodToFieldErrors<K extends string>(
  issues: z.core.$ZodIssue[],
  keys: readonly K[]
): Partial<Record<K, string>> {
  const set = new Set(keys)
  const out: Partial<Record<K, string>> = {}
  for (const issue of issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && set.has(key as K) && !out[key as K]) {
      out[key as K] = issue.message
    }
  }
  return out
}

function mapEmailUpdateError(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes('already registered') || lower.includes('already been registered'))
    return 'That email is already in use.'
  if (lower.includes('same')) return 'That is already your email address.'
  return 'Could not update email. Try again or contact support.'
}

function invalidateAdminUi() {
  revalidatePath('/admin/settings')
  revalidatePath('/admin', 'layout')
}

export async function updateAdminName(
  _prev: AdminNameResult | null,
  formData: FormData
): Promise<AdminNameResult> {
  const parsed = fullNameSchema.safeParse(formString(formData, 'fullName'))
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodToFieldErrors(parsed.error.issues, ['fullName'] as const) }
  }

  const user = await getRequiredUser('ADMIN')
  const now = new Date()
  await db.update(users).set({ fullName: parsed.data, updatedAt: now }).where(eq(users.id, user.id))

  invalidateAdminUi()
  return { ok: true }
}

export async function requestAdminEmailChange(
  _prev: AdminEmailResult | null,
  formData: FormData
): Promise<AdminEmailResult> {
  const parsed = emailChangeSchema.safeParse({ email: formString(formData, 'email') })
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodToFieldErrors(parsed.error.issues, ['email'] as const) }
  }

  const user = await getRequiredUser('ADMIN')

  if (parsed.data.email === user.email.toLowerCase()) {
    return { ok: false, formError: 'That is already your email address.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ email: parsed.data.email })

  if (error) {
    return { ok: false, formError: mapEmailUpdateError(error.message) }
  }

  invalidateAdminUi()
  return { ok: true, pendingConfirmation: true }
}

export async function changeAdminPassword(
  _prev: AdminPasswordResult | null,
  formData: FormData
): Promise<AdminPasswordResult> {
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formString(formData, 'currentPassword'),
    newPassword: formString(formData, 'newPassword'),
    confirmNewPassword: formString(formData, 'confirmNewPassword'),
  })

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: zodToFieldErrors(parsed.error.issues, ['currentPassword', 'newPassword', 'confirmNewPassword'] as const),
    }
  }

  const user = await getRequiredUser('ADMIN')

  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email.trim().toLowerCase(),
    password: parsed.data.currentPassword,
  })

  if (signInError) {
    return { ok: false, formError: 'Current password is incorrect.' }
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.newPassword })

  if (updateError) {
    return { ok: false, formError: 'Could not update password. Try again.' }
  }

  invalidateAdminUi()
  return { ok: true }
}
