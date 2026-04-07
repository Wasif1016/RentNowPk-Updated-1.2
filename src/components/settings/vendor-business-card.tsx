'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateVendorBusinessProfile, type VendorBusinessResult } from '@/lib/actions/vendor-profile'
import { PhoneCountryCombobox } from '@/components/auth/phone-country-combobox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SettingsCard } from '@/components/settings/settings-card'
import { showToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { DEFAULT_PHONE_COUNTRY, getPhoneCountryOptions } from '@/lib/phone/vendor-countries'

async function action(
  _prev: VendorBusinessResult | null,
  formData: FormData
): Promise<VendorBusinessResult> {
  return updateVendorBusinessProfile(_prev, formData)
}

export function VendorBusinessCard({
  initialBusinessName,
  initialCountryCode,
  initialPhoneLocal,
}: {
  initialBusinessName: string
  initialCountryCode: string
  initialPhoneLocal: string
}) {
  const router = useRouter()
  const [countryCode, setCountryCode] = useState(initialCountryCode)
  const [state, formAction, pending] = useActionState(action, null)
  const wasPending = useRef(false)

  const countryMeta = (() => {
    const opts = getPhoneCountryOptions()
    return opts.find((c) => c.code === countryCode) ?? opts.find((c) => c.code === DEFAULT_PHONE_COUNTRY) ?? opts[0]
  })()

  useEffect(() => {
    if (wasPending.current && !pending && state?.ok) {
      showToast('Business profile updated', { type: 'success', duration: 4000 })
      router.refresh()
    }
    wasPending.current = pending
  }, [pending, state, router])

  useEffect(() => {
    if (!state || state.ok || !state.formError) return
    showToast('Could not update business profile', {
      description: state.formError,
      type: 'error',
      duration: 5000,
    })
  }, [state])

  const fe = (state && !state.ok ? state.fieldErrors : undefined) ?? {}

  return (
    <SettingsCard
      title="Business profile"
      description="Business name and WhatsApp contact for customers."
    >
      <form action={formAction} noValidate className="space-y-4">
        <input type="hidden" name="countryCode" value={countryCode} />
        <div>
          <label htmlFor="vendor-businessName" className="block text-sm font-medium text-foreground mb-1.5">
            Business name
          </label>
          <Input
            id="vendor-businessName"
            name="businessName"
            type="text"
            key={initialBusinessName}
            defaultValue={initialBusinessName}
            autoComplete="organization"
            aria-required
            aria-invalid={fe.businessName ? true : undefined}
            className={cn('bg-muted/50 border-border/50 focus:bg-background', fe.businessName && 'border-destructive')}
          />
          {fe.businessName && <p className="text-xs text-destructive mt-1">{fe.businessName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">WhatsApp number</label>
          <div className="flex gap-2">
            <PhoneCountryCombobox
              value={countryCode}
              onValueChange={setCountryCode}
              disabled={pending}
              aria-invalid={fe.countryCode ? true : undefined}
            />
            <Input
              id="vendor-phoneLocal"
              name="phoneLocal"
              type="tel"
              inputMode="tel"
              key={`${initialCountryCode}-${initialPhoneLocal}`}
              defaultValue={initialPhoneLocal}
              autoComplete="tel-national"
              placeholder={countryCode === DEFAULT_PHONE_COUNTRY ? 'e.g. 3147651112' : 'National number only'}
              aria-required
              aria-invalid={fe.phoneLocal ? true : undefined}
              className={cn('flex-1 bg-muted/50 border-border/50 focus:bg-background', fe.phoneLocal && 'border-destructive')}
            />
          </div>
          {fe.countryCode && <p className="text-xs text-destructive mt-1">{fe.countryCode}</p>}
          {fe.phoneLocal && <p className="text-xs text-destructive mt-1">{fe.phoneLocal}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            Choose your country, then enter your number without the country code.
          </p>
        </div>

        <Button type="submit" size="sm" disabled={pending} className="rounded-xl">
          {pending ? 'Saving…' : 'Save business profile'}
        </Button>
      </form>
    </SettingsCard>
  )
}
