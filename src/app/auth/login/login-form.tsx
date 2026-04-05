'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { getOAuthSignInUrl, loginAction, type LoginActionResult } from '@/lib/actions/auth'
import { showToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
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

type LoginState = LoginActionResult | null

async function loginFormAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  return loginAction(formData)
}

const errorMessages: Record<string, string> = {
  setup_incomplete:
    'Your account setup is incomplete. Contact support or try registering again.',
  session: 'We could not complete sign-in. Try again.',
  oauth: 'Sign-in was cancelled or the link expired.',
}

export function LoginForm({
  nextPath,
  errorCode,
}: {
  nextPath: string
  errorCode: string | null
}) {
  const [state, formAction, pending] = useActionState(loginFormAction, null)

  useEffect(() => {
    if (state?.success && state.data.redirectTo) {
      window.location.assign(state.data.redirectTo)
    }
  }, [state])

  const urlError = errorCode ? errorMessages[errorCode] : null
  const fe =
    state && !state.success ? (state.fieldErrors ?? {}) : {}
  const authError = state && !state.success ? state.error : null
  const bannerError = urlError ?? authError

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>Sign in with email or Google.</CardDescription>
      </CardHeader>
      <form action={formAction} noValidate>
        <input type="hidden" name="next" value={nextPath} />
        <CardContent>
          <FieldGroup>
            {bannerError && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {bannerError}
              </div>
            )}
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
            <Field data-invalid={fe.password ? true : undefined}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                aria-required
                aria-invalid={fe.password ? true : undefined}
                className={cn('bg-card', !fe.password && 'border-border')}
              />
              {fe.password && <FieldError>{fe.password}</FieldError>}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t pt-6 [.border-t]:pt-4">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={pending}
            onClick={async () => {
              const next = nextPath || '/customer'
              const r = await getOAuthSignInUrl('google', next)
              if (r.success && r.data?.url) {
                window.location.href = r.data.url
              } else {
                showToast('Could not start Google sign-in', {
                  description: !r.success ? r.error : 'Try again.',
                  type: 'error',
                })
              }
            }}
          >
            Continue with Google
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            New customer?{' '}
            <Link
              href={
                nextPath
                  ? `/auth/signup-customer?next=${encodeURIComponent(nextPath)}`
                  : '/auth/signup-customer'
              }
              className="text-primary underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </p>
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
