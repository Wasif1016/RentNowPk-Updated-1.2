'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isValidPhoneCountryCode, parseLocalToE164 } from '@/lib/phone/vendor-countries'

export type VendorSignupFieldKey =
  | 'businessName'
  | 'email'
  | 'countryCode'
  | 'phoneLocal'
  | 'password'

export type VendorSignupState =
  | {
      ok: false
      fieldErrors: Partial<Record<VendorSignupFieldKey, string>>
      formError?: string
    }
  | { ok: true; needsEmailConfirmation: true }

const VendorSignupSchema = z.object({
  businessName: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(2, 'Business name must be at least 2 characters.').max(200)),
  email: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(z.string().email('Enter a valid email address.')),
  countryCode: z
    .string()
    .transform((s) => s.trim().toUpperCase())
    .refine((c) => isValidPhoneCountryCode(c), {
      message: 'Select a valid country.',
    }),
  phoneLocal: z.string().min(1, 'Enter your phone number.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'Password is too long.'),
})

function zodIssuesToFieldErrors(
  issues: z.core.$ZodIssue[]
): Partial<Record<VendorSignupFieldKey, string>> {
  const fieldErrors: Partial<Record<VendorSignupFieldKey, string>> = {}
  const keys = new Set<VendorSignupFieldKey>([
    'businessName',
    'email',
    'countryCode',
    'phoneLocal',
    'password',
  ])
  for (const issue of issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && keys.has(key as VendorSignupFieldKey)) {
      const k = key as VendorSignupFieldKey
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

/**
 * Vendor self-service registration. Relies on DB trigger `handle_new_user` for public.users + vendor_profiles.
 */
export async function signUpVendorAction(
  _prev: VendorSignupState | null,
  formData: FormData
): Promise<VendorSignupState> {
  const parsed = VendorSignupSchema.safeParse({
    businessName: formData.get('businessName'),
    email: formData.get('email'),
    countryCode: formData.get('countryCode'),
    phoneLocal: formData.get('phoneLocal'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodIssuesToFieldErrors(parsed.error.issues) }
  }

  const phone = parseLocalToE164(parsed.data.countryCode, parsed.data.phoneLocal)
  if (!phone.ok) {
    return {
      ok: false,
      fieldErrors: { phoneLocal: phone.message },
    }
  }

  const e164 = phone.e164
  const businessName = parsed.data.businessName

  const supabase = await createClient()
  const nextPath = '/vendor/vehicles/add'
  const emailRedirectTo = `${appUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo,
      data: {
        role: 'VENDOR',
        business_name: businessName,
        whatsapp_phone: e164,
        full_name: businessName,
        display_name: businessName,
        name: businessName,
        phone: e164,
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
    redirect(nextPath)
  }

  return { ok: true, needsEmailConfirmation: true }
}

function mapAuthError(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes('already registered') || lower.includes('already been registered'))
    return 'An account with this email already exists. Try logging in.'
  if (lower.includes('password')) return 'Password does not meet requirements.'
  return 'Something went wrong. Try again.'
}
