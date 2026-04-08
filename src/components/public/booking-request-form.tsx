'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { loginAction, type LoginActionResult } from '@/lib/actions/auth'
import {
  signUpCustomerAction,
  type CustomerSignupState,
} from '@/lib/actions/customer-auth'
import { createBookingRequest, type BookingRequestState } from '@/lib/actions/bookings'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { showToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

type UserPrefill = {
  fullName: string
  cnic: string | null
}

type Props = {
  vehicleId: string
  withDriverEnabled: boolean
  selfDriveEnabled: boolean
  /** Logged-in customer prefill */
  user: UserPrefill | null
  /** Path for post-login redirect e.g. /vendorSlug/vehicleSlug */
  loginNextPath: string
  accountRole: 'CUSTOMER' | 'VENDOR' | 'ADMIN' | null
}

function localInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function bookingAction(
  prev: BookingRequestState | null,
  formData: FormData
): Promise<BookingRequestState> {
  return createBookingRequest(prev, formData)
}

async function loginFormAction(
  _prev: LoginActionResult | null,
  formData: FormData
): Promise<LoginActionResult> {
  return loginAction(_prev, formData)
}

async function signupFormAction(
  _prev: CustomerSignupState | null,
  formData: FormData
): Promise<CustomerSignupState> {
  return signUpCustomerAction(_prev, formData)
}

function InlineLoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState(loginFormAction, null)

  useEffect(() => {
    if (state?.success && state.data.redirectTo) {
      window.location.assign(state.data.redirectTo)
    }
  }, [state])

  const fe = state && !state.success ? (state.fieldErrors ?? {}) : {}
  const authError = state && !state.success ? state.error : null

  return (
    <form action={formAction} className="space-y-3" noValidate>
      <input type="hidden" name="next" value={nextPath} />
      {authError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {authError}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="auth-email">Email</Label>
        <Input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          className="bg-background"
          aria-invalid={fe.email ? true : undefined}
        />
        {fe.email && <p className="text-xs text-destructive">{fe.email}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="auth-password">Password</Label>
        <Input
          id="auth-password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="bg-background"
          aria-invalid={fe.password ? true : undefined}
        />
        {fe.password && <p className="text-xs text-destructive">{fe.password}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}

function InlineSignupForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState(signupFormAction, null)
  const lastErr = useRef<string | null>(null)

  useEffect(() => {
    if (!state || state.ok) return
    const msg = state.formError
    if (!msg || lastErr.current === msg) return
    lastErr.current = msg
    showToast('Could not create account', { description: msg, type: 'error' })
  }, [state])

  if (state?.ok && state.needsEmailConfirmation) {
    return (
      <div className="rounded-xl border border-border bg-muted/40 px-3 py-4 text-sm text-foreground">
        <p className="font-medium">Check your email</p>
        <p className="mt-2 text-muted-foreground">
          We sent a confirmation link. After you verify, come back here and sign in to complete your booking.
        </p>
      </div>
    )
  }

  const fe = state && !state.ok ? state.fieldErrors : {}

  return (
    <form action={formAction} className="space-y-3" noValidate>
      <input type="hidden" name="next" value={nextPath} />
      <div className="space-y-2">
        <Label htmlFor="su-fullName">Full name</Label>
        <Input id="su-fullName" name="fullName" type="text" autoComplete="name" className="bg-background" />
        {fe.fullName && <p className="text-xs text-destructive">{fe.fullName}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-email">Email</Label>
        <Input id="su-email" name="email" type="email" autoComplete="email" className="bg-background" />
        {fe.email && <p className="text-xs text-destructive">{fe.email}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-password">Password</Label>
        <Input
          id="su-password"
          name="password"
          type="password"
          autoComplete="new-password"
          className="bg-background"
        />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        {fe.password && <p className="text-xs text-destructive">{fe.password}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  )
}

function BookingFormFields({
  vehicleId,
  withDriverEnabled,
  selfDriveEnabled,
  user,
  onSuccessClose,
}: {
  vehicleId: string
  withDriverEnabled: boolean
  selfDriveEnabled: boolean
  user: UserPrefill
  onSuccessClose: () => void
}) {
  const pickupRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLInputElement>(null)
  const closeRef = useRef(onSuccessClose)
  closeRef.current = onSuccessClose

  const [pickupPlaceId, setPickupPlaceId] = useState('')
  const [dropoffPlaceId, setDropoffPlaceId] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [state, formAction, pending] = useActionState(bookingAction, null)
  const fe = state && !state.success ? state.fieldErrors : undefined

  const [pickupAt, setPickupAt] = useState('')
  const [dropoffAt, setDropoffAt] = useState('')

  const searchParams = useSearchParams()

  useEffect(() => {
    const pickupPlaceIdParam = searchParams.get('pickupPlaceId')
    const dropoffPlaceIdParam = searchParams.get('dropoffPlaceId')
    const pickupAddressParam = searchParams.get('pickupAddress')
    const dropoffAddressParam = searchParams.get('dropoffAddress')

    if (pickupPlaceIdParam) setPickupPlaceId(pickupPlaceIdParam)
    if (dropoffPlaceIdParam) setDropoffPlaceId(dropoffPlaceIdParam)
    if (pickupAddressParam) setPickupAddress(pickupAddressParam)
    if (dropoffAddressParam) setDropoffAddress(dropoffAddressParam)
  }, [searchParams])

  useEffect(() => {
    const now = new Date()
    const start = new Date(now.getTime() + 60 * 60 * 1000)
    const end = new Date(now.getTime() + 48 * 60 * 60 * 1000)
    setPickupAt(localInputValue(start))
    setDropoffAt(localInputValue(end))
  }, [])

  useEffect(() => {
    if (state?.success) {
      showToast('Booking request sent', {
        description: 'Your request is pending. The vendor will respond when chat is available.',
        type: 'success',
      })
      closeRef.current()
    } else if (state && !state.success && state.error) {
      showToast('Could not submit', { description: state.error, type: 'error' })
    }
  }, [state])

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()

  useEffect(() => {
    if (!apiKey || !pickupRef.current || !dropRef.current) return
    let cancelled = false
    setOptions({ key: apiKey, v: 'weekly' })

    importLibrary('places')
      .then((places) => {
        if (cancelled || !pickupRef.current || !dropRef.current) return
        const opts: google.maps.places.AutocompleteOptions = {
          fields: ['place_id', 'formatted_address', 'geometry', 'name'],
          componentRestrictions: { country: 'pk' },
        }
        const acP = new places.Autocomplete(pickupRef.current, opts)
        const acD = new places.Autocomplete(dropRef.current, opts)
        acP.addListener('place_changed', () => {
          const p = acP.getPlace()
          if (p?.place_id) {
            setPickupPlaceId(p.place_id)
            setPickupAddress(p.formatted_address || p.name || '')
          }
        })
        acD.addListener('place_changed', () => {
          const p = acD.getPlace()
          if (p?.place_id) {
            setDropoffPlaceId(p.place_id)
            setDropoffAddress(p.formatted_address || p.name || '')
          }
        })
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [apiKey])

  useEffect(() => {
    if (pickupAddress && pickupRef.current) {
      pickupRef.current.value = pickupAddress
    }
    if (dropoffAddress && dropRef.current) {
      dropRef.current.value = dropoffAddress
    }
  }, [pickupAddress, dropoffAddress])

  const driveOptions: { value: 'WITH_DRIVER' | 'SELF_DRIVE'; label: string }[] = []
  if (withDriverEnabled) driveOptions.push({ value: 'WITH_DRIVER', label: 'With driver' })
  if (selfDriveEnabled) driveOptions.push({ value: 'SELF_DRIVE', label: 'Self drive' })

  const defaultDrive = driveOptions[0]?.value ?? 'WITH_DRIVER'

  const canSubmit = pickupPlaceId && dropoffPlaceId && pickupAt && dropoffAt

  return (
    <form className="space-y-4" action={formAction}>
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <input type="hidden" name="pickupPlaceId" value={pickupPlaceId} />
      <input type="hidden" name="dropoffPlaceId" value={dropoffPlaceId} />
      <input type="hidden" name="pickupAddress" value={pickupAddress} />
      <input type="hidden" name="dropoffAddress" value={dropoffAddress} />
      <input type="hidden" name="pickupAt" value={pickupAt ? new Date(pickupAt).toISOString() : ''} />
      <input type="hidden" name="dropoffAt" value={dropoffAt ? new Date(dropoffAt).toISOString() : ''} />

      {!apiKey && (
        <p className="text-sm text-destructive">Maps API key missing — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bk-pickup">Pickup</Label>
          <Input
            ref={pickupRef}
            id="bk-pickup"
            autoComplete="off"
            placeholder="Search pickup"
            className="bg-background"
          />
          {!pickupPlaceId && apiKey && (
            <p className="text-xs text-muted-foreground">Select a location from the dropdown</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="bk-drop">Drop-off</Label>
          <Input
            ref={dropRef}
            id="bk-drop"
            autoComplete="off"
            placeholder="Search destination"
            className="bg-background"
          />
          {!dropoffPlaceId && apiKey && (
            <p className="text-xs text-muted-foreground">Select a location from the dropdown</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pickupAtLocal">Pickup date and time</Label>
          <Input
            id="pickupAtLocal"
            type="datetime-local"
            value={pickupAt}
            onChange={(e) => setPickupAt(e.target.value)}
            className="bg-background"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dropoffAtLocal">Return date and time</Label>
          <Input
            id="dropoffAtLocal"
            type="datetime-local"
            value={dropoffAt}
            onChange={(e) => setDropoffAt(e.target.value)}
            className="bg-background"
            required
          />
        </div>
      </div>
      {fe?.pickupAt && <p className="text-xs text-destructive">{fe.pickupAt}</p>}
      {fe?.dropoffAt && <p className="text-xs text-destructive">{fe.dropoffAt}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            name="fullName"
            required
            defaultValue={user.fullName}
            className="bg-background"
            autoComplete="name"
          />
          {fe?.fullName && <p className="text-xs text-destructive">{fe.fullName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cnic">CNIC (13 digits)</Label>
          <Input
            id="cnic"
            name="cnic"
            required
            inputMode="numeric"
            defaultValue={user.cnic ?? ''}
            className="bg-background"
            placeholder="3710112345678"
          />
          {fe?.cnic && <p className="text-xs text-destructive">{fe.cnic}</p>}
        </div>
      </div>

      {driveOptions.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="driveType">Drive type</Label>
          <select
            id="driveType"
            name="driveType"
            defaultValue={defaultDrive}
            className="border-input bg-background h-9 w-full max-w-md rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            {driveOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          name="note"
          rows={3}
          className="bg-background resize-y"
          placeholder="Any extra details for the vendor"
        />
      </div>

      <Button type="submit" disabled={pending || driveOptions.length === 0 || !canSubmit} className="min-w-[160px]">
        {pending ? 'Sending…' : 'Submit booking request'}
      </Button>
      {driveOptions.length === 0 && (
        <p className="text-sm text-muted-foreground">This listing has no drive options enabled.</p>
      )}
      {!canSubmit && driveOptions.length > 0 && (
        <p className="text-sm text-muted-foreground">Please select pickup and drop-off locations</p>
      )}
    </form>
  )
}

export function BookingRequestForm({
  vehicleId,
  withDriverEnabled,
  selfDriveEnabled,
  user,
  loginNextPath,
  accountRole,
}: Props) {
  const [open, setOpen] = useState(false)

  const driveOptionsCount =
    (withDriverEnabled ? 1 : 0) + (selfDriveEnabled ? 1 : 0)
  const canBook = driveOptionsCount > 0

  if (accountRole && accountRole !== 'CUSTOMER') {
    return (
      <div className="space-y-3">
        <Button type="button" size="lg" className="w-full sm:w-auto" disabled>
          Request booking
        </Button>
        <p className="text-sm text-muted-foreground">
          Booking requests use a customer account. Switch to a personal customer profile to book, or manage your
          fleet from the vendor dashboard.
        </p>
      </div>
    )
  }

  const isCustomer = Boolean(user)

  return (
    <div className="space-y-4">
      <Button
        type="button"
        size="lg"
        className={cn('w-full sm:w-auto')}
        onClick={() => setOpen(true)}
        disabled={!canBook}
      >
        Request booking
      </Button>
      {!canBook && (
        <p className="text-sm text-muted-foreground">This listing has no drive options enabled.</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className="max-h-[min(90vh,800px)] overflow-y-auto sm:max-w-2xl"
        >
          <DialogHeader>
            <DialogTitle>
              {isCustomer ? 'Request a booking' : 'Sign in to book'}
            </DialogTitle>
            <DialogDescription>
              {isCustomer
                ? 'Enter trip details. Distance is calculated when you submit.'
                : 'Use your customer account, or create one — you stay on this page.'}
            </DialogDescription>
          </DialogHeader>

          {isCustomer && user ? (
            <BookingFormFields
              vehicleId={vehicleId}
              withDriverEnabled={withDriverEnabled}
              selfDriveEnabled={selfDriveEnabled}
              user={user}
              onSuccessClose={() => setOpen(false)}
            />
          ) : (
            <Tabs defaultValue="login" className="w-full gap-4">
              <TabsList variant="line" className="w-full justify-start">
                <TabsTrigger value="login">Log in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-4">
                <InlineLoginForm nextPath={loginNextPath} />
              </TabsContent>
              <TabsContent value="signup" className="mt-4">
                <InlineSignupForm nextPath={loginNextPath} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
