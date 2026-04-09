'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { 
  Menu, X, Bell, HelpCircle, Search, LogOut,
  LayoutDashboard, Car, PlusSquare, Calendar, MessageSquare, Settings, Users,
  LucideIcon
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { logoutAction } from '@/lib/actions/auth'
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

const DASHBOARD_ICONS: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  'car': Car,
  'plus-square': PlusSquare,
  'calendar': Calendar,
  'message-square': MessageSquare,
  'settings': Settings,
  'users': Users,
}

function DashboardIcon({ name, className }: { name: string; className?: string }) {
  const Icon = DASHBOARD_ICONS[name] || HelpCircle
  return <Icon className={className} />
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Map HugeIcons/Lucide to Material symbols names if possible, but the user's reference uses hardcoded symbols.
// For now, I'll use the icons from navItems if they are components, or hardcode common ones for the shell logic.

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

  const handleLogout = async () => {
    await logoutAction()
  }

  // Generate a simple title based on pathname if not provided by children (hypothetically)
  const pageTitle = navItems.find(item => isDashboardNavActive(pathname, item.href))?.label || 'Dashboard'

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#f9f9ff] text-[#071c36] font-sans">
      
      {/* Top Navigation Bar */}
      <header className="fixed top-0 right-0 left-0 z-50 flex justify-between items-center px-6 py-4 w-full bg-[#0B1F3A] border-b-4 border-[#000615] shadow-[4px_4px_0px_0px_rgba(0,6,21,1)]">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold text-[#F5A623] italic tracking-tighter uppercase">
            RentNowPk
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative hidden md:block">
            <input 
              className="bg-[#000615] text-white border-2 border-[#F5A623] px-4 py-2 w-64 text-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_#F5A623] rounded-none" 
              placeholder="Search..." 
              type="text"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="md:hidden text-[#F5A623] p-2 border-2 border-[#F5A623] bg-[#000615] active:translate-y-0.5 transition-all" onClick={() => setSidebarOpen(!sidebarOpen)}>
               {sidebarOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
            <div className="hidden md:flex items-center gap-4">
              <button className="text-[#F5A623] hover:bg-[#000615] p-2 transition-all active:translate-y-1">
                <Bell className="size-5" />
              </button>
              <button className="text-[#F5A623] hover:bg-[#000615] p-2 transition-all active:translate-y-1">
                <HelpCircle className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-20">
        {/* SideNavBar - Thick Right Border */}
        <aside
          ref={sidebarRef}
          className={cn(
            'fixed left-0 top-0 h-full z-40 flex flex-col pt-20 w-64 bg-white border-r-4 border-primary transition-transform duration-300 md:sticky md:top-20 md:h-[calc(100vh-5rem)] md:translate-x-0 md:pt-0',
            sidebarOpen ? 'translate-x-0 shadow-[8px_0px_0px_0px_rgba(0,6,21,1)]' : '-translate-x-full'
          )}
        >
          <div className="p-6 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border-2 border-primary shrink-0 bg-[#0B1F3A] flex items-center justify-center text-[#F5A623] font-bold text-xl rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                 {initials(sidebarUserName)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-primary uppercase tracking-tight leading-none mb-1 truncate w-32">{sidebarUserName}</h2>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Verified User</span>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 px-4 space-y-4 overflow-y-auto">
            {navItems.map((item) => {
              const active = isDashboardNavActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 font-bold uppercase tracking-tight px-4 py-3 border-2 transition-all rounded-none",
                    active 
                      ? "bg-[#feae2c] text-primary border-primary shadow-[4px_4px_0px_0px_rgba(0,6,21,1)] mx-0 my-1 active:shadow-none active:translate-x-1 active:translate-y-1" 
                      : "text-primary border-transparent hover:bg-muted hover:border-primary/20 hover:translate-x-1"
                  )}
                >
                  <DashboardIcon name={item.iconName} className="size-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto p-4 space-y-4 border-t-2 border-primary bg-muted/30">
            <button 
              onClick={handleLogout}
              className="w-full bg-[#feae2c] text-primary font-bold py-3 border-2 border-primary shadow-[4px_4px_0px_0px_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 transition-all uppercase text-sm rounded-none"
            >
              Sign Out
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="p-6 md:p-8 space-y-8">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Nav on Mobile if needed, but the drawer is preferred for high contrast */}
      {/* (Keeping existing mobile bottom nav for convenience but restyling it) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe bg-white border-t-4 border-primary shadow-[0px_-4px_0px_0px_rgba(0,6,21,1)]">
        {navItems.slice(0, 4).map((item) => {
          const active = isDashboardNavActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 mx-1 transition-all duration-100 rounded-none border-2",
                active 
                  ? "bg-[#feae2c] text-primary border-primary shadow-[4px_4px_0px_0px_rgba(0,6,21,1)] scale-95" 
                  : "text-primary border-transparent"
              )}
            >
              <DashboardIcon name={item.iconName} className="size-5" />
              <span className="text-[9px] font-bold uppercase mt-1 tracking-tighter">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Background Texture */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
    </div>
  )
}
