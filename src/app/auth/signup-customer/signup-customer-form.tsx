'use client'

import { useActionState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  signUpCustomerAction,
  type CustomerSignupState,
} from '@/lib/actions/customer-auth'
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

async function formAction(
  _prev: CustomerSignupState | null,
  formData: FormData
): Promise<CustomerSignupState> {
  return signUpCustomerAction(_prev, formData)
}

function SignupSuccessCard() {
  const shown = useRef(false)
  useEffect(() => {
    if (shown.current) return
    shown.current = true
    showToast('Check your email', {
      description: 'Open the link we sent to confirm your account.',
      type: 'success',
      duration: 8000,
    })
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We sent a confirmation link. After you verify, you can sign in and request bookings.
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

export function SignupCustomerForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(formAction, null)
  const lastFormError = useRef<string | null>(null)

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
        <CardTitle>Create a customer account</CardTitle>
        <CardDescription>Book vehicles from verified vendors across Pakistan.</CardDescription>
      </CardHeader>
      <form action={action} noValidate>
        <input type="hidden" name="next" value={nextPath} />
        <CardContent>
          <FieldGroup>
            <Field data-invalid={fe.fullName ? true : undefined}>
              <FieldLabel htmlFor="fullName">Full name</FieldLabel>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                className="bg-card"
              />
              {fe.fullName && <FieldError>{fe.fullName}</FieldError>}
            </Field>
            <Field data-invalid={fe.email ? true : undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="bg-card"
              />
              {fe.email && <FieldError>{fe.email}</FieldError>}
            </Field>
            <Field data-invalid={fe.password ? true : undefined}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="bg-card"
              />
              <FieldDescription>At least 8 characters.</FieldDescription>
              {fe.password && <FieldError>{fe.password}</FieldError>}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t pt-6 [.border-t]:pt-4">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Creating account…' : 'Sign up'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Vendor?{' '}
            <Link href="/auth/signup" className="text-primary underline-offset-4 hover:underline">
              List your business
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
