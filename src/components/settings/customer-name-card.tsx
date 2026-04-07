'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateCustomerName, type CustomerNameResult } from '@/lib/actions/customer-profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SettingsCard } from '@/components/settings/settings-card'
import { showToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

async function action(
  _prev: CustomerNameResult | null,
  formData: FormData
): Promise<CustomerNameResult> {
  return updateCustomerName(_prev, formData)
}

export function CustomerNameCard({ initialFullName }: { initialFullName: string }) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(action, null)
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !pending && state?.ok) {
      showToast('Name updated', { type: 'success', duration: 4000 })
      router.refresh()
    }
    wasPending.current = pending
  }, [pending, state, router])

  useEffect(() => {
    if (!state || state.ok || !state.formError) return
    showToast('Could not update name', {
      description: state.formError,
      type: 'error',
      duration: 5000,
    })
  }, [state])

  const fe = (state && !state.ok ? state.fieldErrors : undefined) ?? {}

  return (
    <SettingsCard
      title="Personal name"
      description="Your name as shown in the dashboard."
    >
      <form action={formAction} noValidate className="space-y-4">
        <div>
          <label htmlFor="customer-fullName" className="block text-sm font-medium text-foreground mb-1.5">
            Full name
          </label>
          <Input
            id="customer-fullName"
            name="fullName"
            type="text"
            key={initialFullName}
            defaultValue={initialFullName}
            autoComplete="name"
            aria-required
            aria-invalid={fe.fullName ? true : undefined}
            className={cn('bg-muted/50 border-border/50 focus:bg-background', fe.fullName && 'border-destructive')}
          />
          {fe.fullName && <p className="text-xs text-destructive mt-1">{fe.fullName}</p>}
        </div>
        <Button type="submit" size="sm" disabled={pending} className="rounded-xl">
          {pending ? 'Saving…' : 'Save name'}
        </Button>
      </form>
    </SettingsCard>
  )
}
