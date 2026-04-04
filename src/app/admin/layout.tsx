import Link from 'next/link'
import { getRequiredUser } from '@/lib/auth/session'

const nav = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/vendors', label: 'Vendors' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/settings', label: 'Settings' },
] as const

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getRequiredUser('ADMIN')

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Admin</h2>
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
