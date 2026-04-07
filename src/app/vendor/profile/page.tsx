import { getRequiredUser } from '@/lib/auth/session'
import { getVendorProfileByUserId } from '@/lib/db/vendor-profile'
import {
  DEFAULT_PHONE_COUNTRY,
  e164ToCountryAndNational,
} from '@/lib/phone/vendor-countries'
import { VendorNameCard } from '@/components/settings/vendor-name-card'
import { VendorBusinessCard } from '@/components/settings/vendor-business-card'
import { VendorEmailCard } from '@/components/settings/vendor-email-card'
import { VendorPasswordCard } from '@/components/settings/vendor-password-card'

export default async function VendorSettingsPage() {
  const user = await getRequiredUser('VENDOR')
  const profile = await getVendorProfileByUserId(user.id)

  if (!profile) {
    return (
      <div className="px-6 pt-8 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Vendor profile not found.</p>
      </div>
    )
  }

  const parsed = e164ToCountryAndNational(profile.whatsappPhone)
  const initialCountryCode = parsed?.countryCode ?? DEFAULT_PHONE_COUNTRY
  const initialPhoneLocal = parsed?.nationalNumber ?? ''

  return (
    <div className="px-6 pt-8 pb-10 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account name, business details, email, and password.
        </p>
      </div>

      {/* Settings Cards */}
      <div className="max-w-2xl space-y-6">
        <VendorNameCard initialFullName={user.fullName} />
        <VendorBusinessCard
          key={`${profile.businessName}-${profile.whatsappPhone}`}
          initialBusinessName={profile.businessName}
          initialCountryCode={initialCountryCode}
          initialPhoneLocal={initialPhoneLocal}
        />
        <VendorEmailCard currentEmail={user.email} />
        <VendorPasswordCard />
      </div>
    </div>
  )
}
