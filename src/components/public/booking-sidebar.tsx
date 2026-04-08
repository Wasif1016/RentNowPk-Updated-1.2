'use client'

import { UniversalBookingForm } from './universal-booking-form'

type UserPrefill = {
  fullName: string
  cnic: string | null
}

type BookingSidebarProps = {
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

export function BookingSidebar(props: BookingSidebarProps) {
  return <UniversalBookingForm {...props} />
}
