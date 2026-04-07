'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { changeCustomerPassword, type CustomerPasswordResult } from '@/lib/actions/customer-profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SettingsCard } from '@/components/settings/settings-card'
import { showToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

async function action(
  _prev: CustomerPasswordResult | null,
  formData: FormData
): Promise<CustomerPasswordResult> {
  return changeCustomerPassword(_prev, formData)
}

export function CustomerPasswordCard() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState(action, null)
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !pending && state?.ok) {
      showToast('Password updated', {
        description: 'Use your new password next time you sign in.',
        type: 'success',
        duration: 5000,
      })
      router.refresh()
      formRef.current?.reset()
    }
    wasPending.current = pending
  }, [pending, state, router])

  useEffect(() => {
    if (!state || state.ok || !state.formError) return
    showToast('Could not update password', {
      description: state.formError,
      type: 'error',
      duration: 6000,
    })
  }, [state])

  const fe = (state && !state.ok ? state.fieldErrors : undefined) ?? {}

  return (
    <SettingsCard
      title="Password"
      description="We verify your current password before applying a new one."
    >
      <form ref={formRef} action={formAction} noValidate className="space-y-4">
        <div>
          <label htmlFor="customer-current-password" className="block text-sm font-medium text-foreground mb-1.5">
            Current password
          </label>
          <Input
            id="customer-current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            aria-required
            aria-invalid={fe.currentPassword ? true : undefined}
            className={cn('bg-muted/50 border-border/50 focus:bg-background', fe.currentPassword && 'border-destructive')}
          />
          {fe.currentPassword && <p className="text-xs text-destructive mt-1">{fe.currentPassword}</p>}
        </div>

        <div>
          <label htmlFor="customer-new-password" className="block text-sm font-medium text-foreground mb-1.5">
            New password
          </label>
          <Input
            id="customer-new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            aria-required
            aria-invalid={fe.newPassword ? true : undefined}
            className={cn('bg-muted/50 border-border/50 focus:bg-background', fe.newPassword && 'border-destructive')}
          />
          {fe.newPassword && <p className="text-xs text-destructive mt-1">{fe.newPassword}</p>}
          <p className="text-xs text-muted-foreground mt-1">At least 8 characters.</p>
        </div>

        <div>
          <label htmlFor="customer-confirm-password" className="block text-sm font-medium text-foreground mb-1.5">
            Confirm new password
          </label>
          <Input
            id="customer-confirm-password"
            name="confirmNewPassword"
            type="password"
            autoComplete="new-password"
            aria-required
            aria-invalid={fe.confirmNewPassword ? true : undefined}
            className={cn('bg-muted/50 border-border/50 focus:bg-background', fe.confirmNewPassword && 'border-destructive')}
          />
          {fe.confirmNewPassword && <p className="text-xs text-destructive mt-1">{fe.confirmNewPassword}</p>}
        </div>

        <Button type="submit" size="sm" disabled={pending} className="rounded-xl">
          {pending ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </SettingsCard>
  )
}
