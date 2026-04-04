import Link from 'next/link'
import { getRequiredUser } from '@/lib/auth/session'

const nav = [
  { href: '/vendor', label: 'Dashboard' },
  { href: '/vendor/vehicles', label: 'Vehicles' },
  { href: '/vendor/vehicles/add', label: 'Add vehicle' },
  { href: '/vendor/bookings', label: 'Bookings' },
  { href: '/vendor/settings', label: 'Settings' },
] as const

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const user = await getRequiredUser('VENDOR')

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Vendor portal</h2>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </div>
        <nav className="p-4 space-y-2">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              prefetch
              className="block px-3 py-2 rounded-md hover:bg-accent"
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
