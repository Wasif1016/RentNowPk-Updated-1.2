import { getRequiredUser } from '@/lib/auth/session'
import { AdminNameCard } from '@/components/settings/admin-name-card'
import { AdminEmailCard } from '@/components/settings/admin-email-card'
import { AdminPasswordCard } from '@/components/settings/admin-password-card'

export default async function AdminSettingsPage() {
  const user = await getRequiredUser('ADMIN')

  return (
    <div className="px-6 pt-8 pb-10 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your admin account name, email, and password.
        </p>
      </div>

      {/* Settings Cards */}
      <div className="max-w-2xl space-y-6">
        <AdminNameCard initialFullName={user.fullName} />
        <AdminEmailCard currentEmail={user.email} />
        <AdminPasswordCard />
      </div>
    </div>
  )
}
