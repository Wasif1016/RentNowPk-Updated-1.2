'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { requestVendorEmailChange, type VendorEmailResult } from '@/lib/actions/vendor-profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SettingsCard } from '@/components/settings/settings-card'
import { showToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

async function action(
  _prev: VendorEmailResult | null,
  formData: FormData
): Promise<VendorEmailResult> {
  return requestVendorEmailChange(_prev, formData)
}

export function VendorEmailCard({ currentEmail }: { currentEmail: string }) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(action, null)
  const wasPending = useRef(false)
  const showSuccess = Boolean(state && state.ok && state.pendingConfirmation)

  useEffect(() => {
    if (wasPending.current && !pending && state) {
      if (state.ok && state.pendingConfirmation) {
        showToast('Confirm your new email', {
          description: 'We sent a link to your new address. Click it to finish the change.',
          type: 'success',
          duration: 8000,
        })
        router.refresh()
      } else if (!state.ok && state.formError) {
        showToast('Could not start email change', {
          description: state.formError,
          type: 'error',
          duration: 6000,
        })
      }
    }
    wasPending.current = pending
  }, [pending, state, router])

  const fe = (state && !state.ok ? state.fieldErrors : undefined) ?? {}

  return (
    <SettingsCard
      title="Email address"
      description={`Current sign-in email: ${currentEmail}`}
    >
      {showSuccess ? (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-700">
            Check the inbox of the address you entered and click the confirmation link. You can close this page.
          </p>
        </div>
      ) : (
        <form action={formAction} noValidate className="space-y-4">
          <div>
            <label htmlFor="vendor-new-email" className="block text-sm font-medium text-foreground mb-1.5">
              New email address
            </label>
            <Input
              id="vendor-new-email"
              name="email"
              type="email"
              autoComplete="email"
              aria-required
              aria-invalid={fe.email ? true : undefined}
              className={cn('bg-muted/50 border-border/50 focus:bg-background', fe.email && 'border-destructive')}
              disabled={pending}
            />
            {fe.email && <p className="text-xs text-destructive mt-1">{fe.email}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              We will send a confirmation link to the new address.
            </p>
          </div>
          <Button type="submit" size="sm" disabled={pending} className="rounded-xl">
            {pending ? 'Sending…' : 'Change email'}
          </Button>
        </form>
      )}
    </SettingsCard>
  )
}
