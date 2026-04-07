'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Menu, X, ChevronDown } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatUnreadBadge } from '@/lib/format/unread'
import { type DashboardNavItem, isDashboardNavActive } from './dashboard-nav'

export type DashboardShellUser = {
  email: string
  fullName: string
  avatarUrl: string | null
  /** Vendor verification status — only used by vendor dashboard. */
  verificationStatus?: string | null
}

export type DashboardShellProps = {
  navItems: DashboardNavItem[]
  sidebarUserName: string
  user: DashboardShellUser
  navUnreadCounts?: Partial<Record<string, number>>
  children: React.ReactNode
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function DashboardShell({
  navItems,
  sidebarUserName,
  user,
  navUnreadCounts,
  children,
}: DashboardShellProps) {
  const pathname = usePathname() ?? ''
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    if (!sidebarOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        setSidebarOpen(false)
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [sidebarOpen])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-xl bg-card p-2 text-muted-foreground shadow-sm lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-72 bg-card border-r border-border flex flex-col shadow-sm transition-transform duration-200 ease-in-out lg:sticky lg:z-auto lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="px-6 py-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-foreground">
              RentNow<span className="text-primary">Pk</span>
            </span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isDashboardNavActive(pathname, item.href)
            const unread = navUnreadCounts?.[item.href] ?? 0
            const unreadLabel = formatUnreadBadge(unread)
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  strokeWidth={2}
                  className={cn(
                    'h-5 w-5 shrink-0',
                    active ? 'text-primary' : 'text-muted-foreground/60'
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {unreadLabel ? (
                  <Badge
                    variant="secondary"
                    className="ml-auto shrink-0 tabular-nums text-[11px] px-1.5 py-0"
                  >
                    {unreadLabel}
                  </Badge>
                ) : null}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-5 border-t border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-1 ring-border">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt="" />
              ) : null}
              <AvatarFallback className="text-sm font-bold text-primary bg-primary/10">
                {initials(sidebarUserName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {sidebarUserName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          </div>

          {user.verificationStatus === 'APPROVED' && (
            <div className="mt-3 inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              Verified Vendor
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="flex min-h-0 flex-1 flex-col">
          {children}
        </div>
      </main>
    </div>
  )
}
