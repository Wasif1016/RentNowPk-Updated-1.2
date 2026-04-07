import { getRequiredUser } from '@/lib/auth/session'
import { CustomerNameCard } from '@/components/settings/customer-name-card'
import { CustomerEmailCard } from '@/components/settings/customer-email-card'
import { CustomerPasswordCard } from '@/components/settings/customer-password-card'

export default async function CustomerSettingsPage() {
  const user = await getRequiredUser('CUSTOMER')

  return (
    <div className="px-6 pt-8 pb-10 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account name, email, and password.
        </p>
      </div>

      {/* Settings Cards */}
      <div className="max-w-2xl space-y-6">
        <CustomerNameCard initialFullName={user.fullName} />
        <CustomerEmailCard currentEmail={user.email} />
        <CustomerPasswordCard />
      </div>
    </div>
  )
}
