'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { signUpVendorAction, type VendorSignupState } from '@/lib/actions/vendor-auth'
import {
  DEFAULT_PHONE_COUNTRY,
  getPhoneCountryOptions,
} from '@/lib/phone/vendor-countries'
import { PhoneCountryCombobox } from '@/components/auth/phone-country-combobox'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldError,
} from '@/components/ui/field'
import { showToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

async function signupFormAction(
  _prev: VendorSignupState | null,
  formData: FormData
): Promise<VendorSignupState> {
  return signUpVendorAction(_prev, formData)
}

function SignupSuccessCard() {
  const shown = useRef(false)
  useEffect(() => {
    if (shown.current) return
    shown.current = true
    showToast('Check your email', {
      description: 'Open the link we sent to confirm your account, then you can add your first vehicle.',
      type: 'success',
      duration: 8000,
    })
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We sent a confirmation link. After you verify your email, you will be redirected to add
          your first vehicle.
        </CardDescription>
      </CardHeader>
      <CardFooter className="border-t pt-6 [.border-t]:pt-4">
        <p className="text-center text-sm text-muted-foreground w-full">
          Already confirmed?{' '}
          <Link href="/auth/login" className="text-primary underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupFormAction, null)
  const [countryCode, setCountryCode] = useState(DEFAULT_PHONE_COUNTRY)
  const lastFormError = useRef<string | null>(null)

  const countryMeta = useMemo(() => {
    const opts = getPhoneCountryOptions()
    return (
      opts.find((c) => c.code === countryCode) ??
      opts.find((c) => c.code === DEFAULT_PHONE_COUNTRY) ??
      opts[0]
    )
  }, [countryCode])

  useEffect(() => {
    if (!state || state.ok) return
    const msg = state.formError
    if (!msg || lastFormError.current === msg) return
    lastFormError.current = msg
    showToast('Could not create account', {
      description: msg,
      type: 'error',
      duration: 6000,
    })
  }, [state])

  if (state?.ok && state.needsEmailConfirmation) {
    return <SignupSuccessCard />
  }

  const fe = state && !state.ok ? state.fieldErrors : {}

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor registration</CardTitle>
        <CardDescription>
          List your fleet on RentNowPk. You will verify your email before accessing the dashboard.
        </CardDescription>
      </CardHeader>
      <form action={formAction} noValidate>
        <input type="hidden" name="countryCode" value={countryCode} />
        <CardContent>
          <FieldGroup>
            <Field data-invalid={fe.businessName ? true : undefined}>
              <FieldLabel htmlFor="businessName">Business name</FieldLabel>
              <Input
                id="businessName"
                name="businessName"
                type="text"
                autoComplete="organization"
                aria-required
                aria-invalid={fe.businessName ? true : undefined}
                className={cn('bg-card', !fe.businessName && 'border-border')}
              />
              {fe.businessName && <FieldError>{fe.businessName}</FieldError>}
            </Field>
            <Field data-invalid={fe.email ? true : undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                aria-required
                aria-invalid={fe.email ? true : undefined}
                className={cn('bg-card', !fe.email && 'border-border')}
              />
              {fe.email && <FieldError>{fe.email}</FieldError>}
            </Field>
            <Field data-invalid={fe.countryCode || fe.phoneLocal ? true : undefined}>
              <FieldLabel>WhatsApp number</FieldLabel>
              <div className="flex w-full gap-2 min-w-0">
                <PhoneCountryCombobox
                  value={countryCode}
                  onValueChange={setCountryCode}
                  disabled={pending}
                  aria-invalid={fe.countryCode ? true : undefined}
                />
                <Input
                  id="phoneLocal"
                  name="phoneLocal"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder={
                    countryCode === DEFAULT_PHONE_COUNTRY
                      ? 'e.g. 3147651112'
                      : 'National number only'
                  }
                  aria-required
                  aria-invalid={fe.phoneLocal ? true : undefined}
                  className={cn(
                    'min-w-0 flex-1 bg-card',
                    !fe.phoneLocal && 'border-border'
                  )}
                />
              </div>
              {fe.countryCode && <FieldError>{fe.countryCode}</FieldError>}
              {fe.phoneLocal && <FieldError>{fe.phoneLocal}</FieldError>}
              <FieldDescription>
                Choose your country (default Pakistan), then enter your number without the country
                code — we use {countryMeta.label} for formatting and validation.
              </FieldDescription>
            </Field>
            <Field data-invalid={fe.password ? true : undefined}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                aria-required
                aria-invalid={fe.password ? true : undefined}
                className={cn('bg-card', !fe.password && 'border-border')}
              />
              {fe.password && <FieldError>{fe.password}</FieldError>}
              <FieldDescription>At least 8 characters.</FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t pt-6 [.border-t]:pt-4">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Creating account…' : 'Create vendor account'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
