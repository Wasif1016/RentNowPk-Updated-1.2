'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import {
  resolveRedirectAfterLogin,
  sanitizeNextPath,
  type AppRole,
} from '@/lib/auth/safe-next'
import { formString } from '@/lib/form/form-data'

const LoginSchema = z.object({
  email: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(
      z
        .string()
        .min(1, 'Enter your email address.')
        .email('Enter a valid email address.')
    ),
  password: z.string().min(1, 'Enter your password.'),
})

export type LoginFieldKey = 'email' | 'password'

export type LoginActionResult =
  | { success: true; data: { redirectTo: string } }
  | {
      success: false
      fieldErrors?: Partial<Record<LoginFieldKey, string>>
      error?: string
    }

function loginZodToFieldErrors(
  issues: z.core.$ZodIssue[]
): Partial<Record<LoginFieldKey, string>> {
  const fieldErrors: Partial<Record<LoginFieldKey, string>> = {}
  for (const issue of issues) {
    const key = issue.path[0]
    if (key === 'email' || key === 'password') {
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
  }
  return fieldErrors
}

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }

export async function loginAction(
  _prevState: any,
  formData: FormData
): Promise<LoginActionResult> {
  const nextRaw = formData.get('next')
  const next = typeof nextRaw === 'string' ? nextRaw : null

  const parsed = LoginSchema.safeParse({
    email: formString(formData, 'email'),
    password: formString(formData, 'password'),
  })

  if (!parsed.success) {
    return { success: false, fieldErrors: loginZodToFieldErrors(parsed.error.issues) }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email.trim().toLowerCase(),
    password: parsed.data.password,
  })

  if (error) {
    return { success: false, error: mapLoginError(error.message) }
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) {
    return { success: false, error: 'Could not sign in.' }
  }

  const [dbUser] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1)

  if (!dbUser) {
    await supabase.auth.signOut()
    return {
      success: false,
      error: 'Account setup is incomplete. Contact support or try signing up again.',
    }
  }

  const role = dbUser.role as AppRole
  const redirectTo = resolveRedirectAfterLogin(role, next)

  return { success: true, data: { redirectTo } }
}

function mapLoginError(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes('invalid login') || lower.includes('invalid credentials'))
    return 'Invalid email or password.'
  if (lower.includes('email not confirmed')) return 'Please confirm your email before signing in.'
  return 'Could not sign in. Try again.'
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('signOut', error.message)
  }

  redirect('/')
}

export async function getOAuthSignInUrl(
  provider: 'google' | 'apple',
  nextRaw?: string | null
) {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (!base) {
    return { success: false, error: 'App URL is not configured' }
  }

  const next = sanitizeNextPath(nextRaw ?? null, '/customer')
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${base}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: { url: data.url } }
}

export async function resetPasswordAction(
  _prevState: any,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get('email')

  if (!email || typeof email !== 'string') {
    return { success: false, error: 'Email is required' }
  }

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (!base) {
    return { success: false, error: 'App URL is not configured' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/reset-password`,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
