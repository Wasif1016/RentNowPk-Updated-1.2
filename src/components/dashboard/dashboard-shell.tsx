'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Menu, X, ChevronDown, CheckCircle } from 'lucide-react'

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
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-md bg-[#0B1B3D] border-2 border-[#F5A623] p-2 text-[#F5A623] shadow-[4px_4px_0_#0F1E32] lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" strokeWidth={3} />
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0B1B3D]/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-72 bg-[#0B1B3D] border-r-4 border-[#F5A623] flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] lg:sticky lg:z-auto lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 rounded-md p-1.5 text-[#F5A623] hover:bg-white/10 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-6 w-6" strokeWidth={3} />
        </button>

        {/* Logo Section */}
        <div className="relative px-6 py-10 border-b-2 border-white/5 overflow-hidden">
          {/* Branded Pinstripe Background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'repeating-linear-gradient(45deg, #F5A623, #F5A623 1px, transparent 1px, transparent 10px)' }} />
          
          <Link href="/" className="relative z-10 flex items-center gap-2 group">
            <span className="text-2xl font-black tracking-tighter text-white uppercase italic">
              RentNow<span className="text-[#F5A623] not-italic">Pk</span>
            </span>
          </Link>
          <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.3em] text-[#F5A623] mt-2 leading-none">
            Member Portal
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
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
                  'group flex items-center gap-3 px-4 py-3.5 rounded-sm text-[11px] font-black uppercase tracking-wider transition-all border-2 border-transparent',
                  active
                    ? 'bg-[#F5A623] text-[#0B1B3D] border-[#0B1B3D] shadow-[4px_4px_0_rgba(245,166,35,0.3)]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-sm transition-colors shrink-0",
                  active ? "bg-[#0B1B3D]" : "group-hover:bg-white/10"
                )}>
                  <HugeiconsIcon
                    icon={item.icon}
                    strokeWidth={3}
                    className={cn(
                      'h-4 w-4',
                      active ? 'text-[#F5A623]' : 'text-inherit opacity-70 group-hover:opacity-100'
                    )}
                  />
                </div>
                <span className="flex-1 truncate">{item.label}</span>
                {unreadLabel ? (
                  <span className={cn(
                    "ml-auto shrink-0 font-black tabular-nums text-[9px] px-2 py-0.5 rounded-full border shadow-sm",
                    active ? "bg-[#0B1B3D] text-[#F5A623] border-[#F5A623]/20" : "bg-[#F5A623] text-[#0B1B3D] border-[#0B1B3D]"
                  )}>
                    {unreadLabel}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>

        {/* User profile section */}
        <div className="p-6 border-t-2 border-white/5 bg-black/10">
          <div className="flex items-center gap-4 group">
            <div className="relative shrink-0">
               <Avatar className="h-10 w-10 border-2 border-[#F5A623] rounded-sm bg-[#0B1B3D]">
                 {user.avatarUrl ? (
                   <AvatarImage src={user.avatarUrl} alt="" className="object-cover" />
                 ) : null}
                 <AvatarFallback className="text-xs font-black text-[#F5A623] bg-transparent">
                   {initials(sidebarUserName)}
                 </AvatarFallback>
               </Avatar>
               {user.verificationStatus === 'APPROVED' && (
                  <div className="absolute -top-1 -right-1 bg-[#F5A623] p-0.5 rounded-full border border-[#0B1B3D]">
                     <CheckCircle className="h-2.5 w-2.5 text-[#0B1B3D]" strokeWidth={4} />
                  </div>
               )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black uppercase text-white tracking-widest truncate">
                {sidebarUserName}
              </p>
              <p className="text-[9px] font-bold text-white/40 truncate mt-0.5 tracking-tight uppercase">
                {user.email}
              </p>
            </div>
          </div>

          {user.verificationStatus === 'APPROVED' && (
            <div className="mt-4 flex items-center justify-center gap-2 bg-[#F5A623]/10 border border-[#F5A623]/20 text-[#F5A623] text-[9px] font-black uppercase tracking-widest py-1.5 rounded-sm">
               VERIFIED VENDOR
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 bg-gray-50/30">
        <div className="max-w-[1600px] mx-auto min-h-screen flex flex-col">
          {children}
        </div>
      </main>
    </div>
  )
}
