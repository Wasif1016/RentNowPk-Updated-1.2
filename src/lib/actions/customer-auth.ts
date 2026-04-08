'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { ZodIssue } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { formString } from '@/lib/form/form-data'
import { sanitizeNextPath } from '@/lib/auth/safe-next'
import { loginAction } from './auth'

export type CustomerSignupFieldKey = 'fullName' | 'email' | 'password'

export type CustomerSignupState =
  | {
      ok: false
      fieldErrors: Partial<Record<CustomerSignupFieldKey, string>>
      formError?: string
    }
  | { ok: true; needsEmailConfirmation: boolean; redirectTo?: string }

const CustomerSignupSchema = z.object({
  fullName: z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length >= 2, { message: 'Enter your full name.' })
    .refine((s) => s.length <= 200, { message: 'Name is too long.' }),
  email: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(
      z
        .string()
        .min(1, 'Enter your email address.')
        .email('Enter a valid email address.')
    ),
  password: z
    .string()
    .refine((s) => s.length > 0, { message: 'Enter a password.' })
    .refine((s) => s.length >= 8, {
      message: 'Password must be at least 8 characters.',
    })
    .refine((s) => s.length <= 128, { message: 'Password is too long.' }),
})

function zodIssuesToFieldErrors(
  issues: ZodIssue[]
): Partial<Record<CustomerSignupFieldKey, string>> {
  const fieldErrors: Partial<Record<CustomerSignupFieldKey, string>> = {}
  const keys = new Set<CustomerSignupFieldKey>(['fullName', 'email', 'password'])
  for (const issue of issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && keys.has(key as CustomerSignupFieldKey)) {
      const k = key as CustomerSignupFieldKey
      if (!fieldErrors[k]) fieldErrors[k] = issue.message
    }
  }
  return fieldErrors
}

function appUrl(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (!u) throw new Error('NEXT_PUBLIC_APP_URL is not set')
  return u
}

function mapAuthError(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes('already registered') || lower.includes('already been registered'))
    return 'An account with this email already exists. Try logging in.'
  if (lower.includes('password')) return 'Password does not meet requirements.'
  return 'Something went wrong. Try again.'
}

/**
 * Customer signup with auto-verification and immediate login.
 */
export async function signUpAndLoginCustomerAction(
  _prev: CustomerSignupState | null,
  formData: FormData
): Promise<CustomerSignupState> {
  const nextRaw = formString(formData, 'next')
  const next = sanitizeNextPath(nextRaw || null, '/customer')

  const parsed = CustomerSignupSchema.safeParse({
    fullName: formString(formData, 'fullName'),
    email: formString(formData, 'email'),
    password: formString(formData, 'password'),
  })

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodIssuesToFieldErrors(parsed.error.issues) }
  }

  const supabase = await createClient()
  
  // 1. Create the user
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        role: 'CUSTOMER',
        full_name: parsed.data.fullName,
        display_name: parsed.data.fullName,
        name: parsed.data.fullName,
      },
    },
  })

  if (error) {
    return {
      ok: false,
      fieldErrors: {},
      formError: mapAuthError(error.message),
    }
  }

  if (!data.user) {
    return {
      ok: false,
      fieldErrors: {},
      formError: 'Could not create account. Try again.',
    }
  }

  // 2. Auto-verify via admin client
  try {
    const admin = getSupabaseAdmin()
    const { error: adminErr } = await admin.auth.admin.updateUserById(data.user.id, {
      email_confirm: true,
    })
    if (adminErr) {
      console.error('Auto-verify error:', adminErr.message)
    }
  } catch (err) {
    console.error('Failed to get admin client for auto-verify:', err)
  }

  // 3. Login immediately
  const loginForm = new FormData()
  loginForm.set('email', parsed.data.email)
  loginForm.set('password', parsed.data.password)
  loginForm.set('next', next)

  const loginResult = await loginAction(null, loginForm)

  if (loginResult.success) {
    return { ok: true, needsEmailConfirmation: false, redirectTo: loginResult.data.redirectTo }
  } else {
    return {
      ok: false,
      fieldErrors: {},
      formError: loginResult.error || 'Account created but could not log in automatically. Please sign in manually.',
    }
  }
}

/**
 * Legacy customer self-service registration (with email confirmation).
 */
export async function signUpCustomerAction(
  _prev: CustomerSignupState | null,
  formData: FormData
): Promise<CustomerSignupState> {
  const nextRaw = formString(formData, 'next')
  const next = sanitizeNextPath(nextRaw || null, '/customer')

  const parsed = CustomerSignupSchema.safeParse({
    fullName: formString(formData, 'fullName'),
    email: formString(formData, 'email'),
    password: formString(formData, 'password'),
  })

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodIssuesToFieldErrors(parsed.error.issues) }
  }

  const supabase = await createClient()
  const emailRedirectTo = `${appUrl()}/auth/callback?next=${encodeURIComponent(next)}`

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo,
      data: {
        role: 'CUSTOMER',
        full_name: parsed.data.fullName,
        display_name: parsed.data.fullName,
        name: parsed.data.fullName,
      },
    },
  })

  if (error) {
    return {
      ok: false,
      fieldErrors: {},
      formError: mapAuthError(error.message),
    }
  }

  if (!data.user) {
    return {
      ok: false,
      fieldErrors: {},
      formError: 'Could not create account. Try again.',
    }
  }

  if (data.session) {
    redirect(next)
  }

  return { ok: true, needsEmailConfirmation: true }
}
