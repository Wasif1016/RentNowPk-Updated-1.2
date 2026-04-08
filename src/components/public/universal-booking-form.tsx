'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { createBookingRequest } from '@/lib/actions/bookings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { showToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { ShieldCheck, ChevronLeft, Loader2 } from 'lucide-react'
import { InlineLoginForm, InlineSignupForm } from './inline-auth-forms'

type UserPrefill = {
  fullName: string
  cnic: string | null
}

type UniversalBookingFormProps = {
  vehicleId: string
  withDriverEnabled: boolean
  selfDriveEnabled: boolean
  user: UserPrefill | null
  loginNextPath: string
  accountRole: 'CUSTOMER' | 'VENDOR' | 'ADMIN' | null
  initialSearch?: {
    pickupPlaceId?: string
    dropoffPlaceId?: string
    pickupAddress?: string
    dropoffAddress?: string
  }
}

function localInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function UniversalBookingForm({
  vehicleId,
  withDriverEnabled,
  selfDriveEnabled,
  user,
  loginNextPath,
  accountRole,
  initialSearch,
}: UniversalBookingFormProps) {
  const router = useRouter()
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()
  
  // -- Form State --
  const pickupRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLInputElement>(null)
  
  const [step, setStep] = useState<'DETAILS' | 'AUTH'>('DETAILS')
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN')

  const [pickupPlaceId, setPickupPlaceId] = useState(initialSearch?.pickupPlaceId || '')
  const [dropoffPlaceId, setDropoffPlaceId] = useState(initialSearch?.dropoffPlaceId || '')
  const [pickupAddress, setPickupAddress] = useState(initialSearch?.pickupAddress || '')
  const [dropoffAddress, setDropoffAddress] = useState(initialSearch?.dropoffAddress || '')
  const [pickupAt, setPickupAt] = useState('')
  const [dropoffAt, setDropoffAt] = useState('')
  const [driveType, setDriveType] = useState<'WITH_DRIVER' | 'SELF_DRIVE'>(
    withDriverEnabled ? 'WITH_DRIVER' : 'SELF_DRIVE'
  )
  const [cnic, setCnic] = useState(user?.cnic || '')
  const [note, setNote] = useState('')
  const [mounted, setMounted] = useState(false)

  const [bookingState, bookingAction, bookingPending] = useActionState(createBookingRequest, null)

  // -- Initial Dates --
  useEffect(() => {
    setMounted(true)
    const now = new Date()
    setPickupAt(localInputValue(new Date(now.getTime() + 60 * 60 * 1000)))
    setDropoffAt(localInputValue(new Date(now.getTime() + 48 * 60 * 60 * 1000)))
  }, [])

  // -- Maps --
  useEffect(() => {
    if (!apiKey || !pickupRef.current || !dropRef.current || step !== 'DETAILS') return
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
            setPickupPlaceId(p.place_id || '')
            setPickupAddress(p.formatted_address || p.name || '')
          }
        })
        acD.addListener('place_changed', () => {
          const p = acD.getPlace()
          if (p?.place_id) {
            setDropoffPlaceId(p.place_id || '')
            setDropoffAddress(p.formatted_address || p.name || '')
          }
        })
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [apiKey, step])

  useEffect(() => {
    if (pickupAddress && pickupRef.current) pickupRef.current.value = pickupAddress
    if (dropoffAddress && dropRef.current) dropRef.current.value = dropoffAddress
  }, [pickupAddress, dropoffAddress, step])

  // -- Handling Submissions --
  useEffect(() => {
    if (bookingState?.success) {
      showToast('Booking request sent!', { type: 'success' })
      router.refresh()
    } else if (bookingState && !bookingState.success && bookingState.error) {
      showToast('Booking failed', { description: bookingState.error, type: 'error' })
    }
  }, [bookingState, router])

  const handleBookClick = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setStep('AUTH')
    } else {
      const fd = new FormData()
      fd.append('vehicleId', vehicleId)
      fd.append('pickupPlaceId', pickupPlaceId)
      fd.append('dropoffPlaceId', dropoffPlaceId)
      fd.append('pickupAddress', pickupAddress)
      fd.append('dropoffAddress', dropoffAddress)
      fd.append('pickupAt', new Date(pickupAt).toISOString())
      fd.append('dropoffAt', new Date(dropoffAt).toISOString())
      fd.append('driveType', driveType)
      fd.append('fullName', user.fullName)
      fd.append('cnic', cnic)
      fd.append('note', note)
      bookingAction(fd)
    }
  }

  const onAuthSuccess = () => {
    router.refresh()
  }

  // To prevent hydration mismatch, we ensure 'disabled' is consistent on first render.
  // On server, pickupPlaceId etc. will be populated from props if they exist.
  const canSubmit = !!(pickupPlaceId && dropoffPlaceId && (mounted ? (pickupAt && dropoffAt) : true) && (user ? cnic.length >= 5 : true))

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white border-[4px] border-[#0B1B3D] p-6 shadow-[8px_8px_0px_0px_#F8991D]">
        
        {step === 'DETAILS' ? (
          <>
            <h3 className="text-2xl font-black text-[#0B1B3D] mb-6 uppercase tracking-tighter italic">Booking Details</h3>
            <form onSubmit={handleBookClick} className="space-y-5">
              <div className="space-y-4">
                {user && (
                    <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#0B1B3D]/50">Full Name</Label>
                    <Input
                        defaultValue={user.fullName}
                        className="rounded-none border-2 border-[#0B1B3D]/10 focus:border-[#0B1B3D] h-12 font-bold bg-[#F8F9FA]"
                        readOnly
                    />
                    </div>
                )}

                {user && (
                    <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#0B1B3D]/50">CNIC Number</Label>
                    <Input
                        value={cnic}
                        onChange={(e) => setCnic(e.target.value)}
                        className="rounded-none border-2 border-[#0B1B3D]/10 focus:border-[#0B1B3D] h-12 font-bold bg-[#F8F9FA]"
                        placeholder="42101-XXXXXXX-X"
                        required
                    />
                    </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-[#0B1B3D]/50">Pickup Location</Label>
                  <Input
                    ref={pickupRef}
                    autoComplete="off"
                    placeholder="Where are you starting?"
                    className="rounded-none border-2 border-[#0B1B3D]/10 focus:border-[#0B1B3D] h-12 font-bold bg-[#F8F9FA]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-[#0B1B3D]/50">Drop-off Location</Label>
                  <Input
                    ref={dropRef}
                    autoComplete="off"
                    placeholder="Where are you going?"
                    className="rounded-none border-2 border-[#0B1B3D]/10 focus:border-[#0B1B3D] h-12 font-bold bg-[#F8F9FA]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#0B1B3D]/50">Pickup Date</Label>
                    <Input
                      type="datetime-local"
                      value={pickupAt}
                      onChange={(e) => setPickupAt(e.target.value)}
                      className="rounded-none border-2 border-[#0B1B3D]/10 focus:border-[#0B1B3D] h-12 font-bold bg-[#F8F9FA] text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#0B1B3D]/50">Return Date</Label>
                    <Input
                      type="datetime-local"
                      value={dropoffAt}
                      onChange={(e) => setDropoffAt(e.target.value)}
                      className="rounded-none border-2 border-[#0B1B3D]/10 focus:border-[#0B1B3D] h-12 font-bold bg-[#F8F9FA] text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-[#0B1B3D]/50">Drive Type</Label>
                  <select
                    value={driveType}
                    onChange={(e) => setDriveType(e.target.value as any)}
                    className="w-full h-12 rounded-none border-2 border-[#0B1B3D]/10 focus:border-[#0B1B3D] font-bold bg-[#F8F9FA] px-3 appearance-none outline-none"
                  >
                    {withDriverEnabled && <option value="WITH_DRIVER">With Driver</option>}
                    {selfDriveEnabled && <option value="SELF_DRIVE">Self Drive</option>}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-[#0B1B3D]/5">
                <Label className="text-[10px] font-black uppercase text-[#0B1B3D]/40 tracking-[0.2em] mb-3 block">Extra Notes</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Need something specific?"
                  className="rounded-none border-2 border-[#0B1B3D]/10 focus:border-[#0B1B3D] bg-[#F8F9FA] min-h-[80px]"
                />
              </div>

              <Button 
                type="submit" 
                disabled={bookingPending || !canSubmit}
                className="w-full bg-[#0B1B3D] text-white font-black text-lg h-14 rounded-none border-2 border-[#0B1B3D] shadow-[4px_4px_0px_0px_#F8991D] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#F8991D] transition-all uppercase italic"
              >
                {bookingPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                {user ? (bookingPending ? 'Sending Request...' : 'Book This Vehicle') : 'Next: Sign In to Book'}
              </Button>
            </form>
          </>
        ) : (
          <div className="space-y-6">
            <button 
              onClick={() => setStep('DETAILS')}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#0B1B3D]/50 hover:text-[#0B1B3D] transition-colors"
            >
              <ChevronLeft className="h-3 w-3" />
              Back to Details
            </button>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-[#0B1B3D] uppercase tracking-tighter">
                {authMode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
              </h3>
              <p className="text-xs font-bold text-[#0B1B3D]/60 uppercase">Almost there! We just need your info to link the booking.</p>
            </div>

            <div className="flex border-2 border-[#0B1B3D] p-1 gap-1">
              <button 
                onClick={() => setAuthMode('LOGIN')}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase transition-all",
                  authMode === 'LOGIN' ? "bg-[#0B1B3D] text-white" : "hover:bg-[#0B1B3D]/5"
                )}
              >
                Login
              </button>
              <button 
                onClick={() => setAuthMode('SIGNUP')}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase transition-all",
                  authMode === 'SIGNUP' ? "bg-[#0B1B3D] text-white" : "hover:bg-[#0B1B3D]/5"
                )}
              >
                Sign Up
              </button>
            </div>

            {authMode === 'LOGIN' ? (
              <InlineLoginForm next={loginNextPath} onSuccess={onAuthSuccess} />
            ) : (
              <InlineSignupForm next={loginNextPath} onSuccess={onAuthSuccess} />
            )}
          </div>
        ) }
      </div>

      <div className="bg-[#F8991D]/10 border-2 border-[#F8991D] p-5 flex gap-4">
        <ShieldCheck className="h-8 w-8 text-[#F8991D] shrink-0" />
        <p className="text-[11px] font-black leading-tight uppercase tracking-tight">
          RentNowPk Security: Protected payments and verified vendors guaranteed.
        </p>
      </div>
    </div>
  )
}
