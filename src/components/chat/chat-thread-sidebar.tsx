'use client'

import { format } from 'date-fns'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { BookingListRow } from '@/lib/db/chat'
import { formatUnreadBadge } from '@/lib/format/unread'
import { cn } from '@/lib/utils'

const STATUS_LABELS: Record<BookingListRow['status'], string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  COMPLETED: 'Completed',
}

const ALL_STATUSES = Object.keys(STATUS_LABELS) as BookingListRow['status'][]

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function relativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return format(date, 'h:mm a')
  if (days === 1) return 'Yesterday'
  if (days < 7) return format(date, 'EEE')
  return format(date, 'MMM d')
}

export function ChatThreadSidebar({
  rows,
  basePath,
}: {
  rows: BookingListRow[]
  basePath: string
}) {
  const pathname = usePathname() ?? ''
  const normalizedBase = basePath.replace(/\/$/, '')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookingListRow['status'] | 'ALL'>('ALL')

  const filtered = rows.filter((row) => {
    const matchSearch =
      !search.trim() ||
      row.otherPartyName.toLowerCase().includes(search.toLowerCase().trim()) ||
      row.vehicleName.toLowerCase().includes(search.toLowerCase().trim())
    const matchStatus = statusFilter === 'ALL' || row.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <aside className="flex w-full md:max-w-[360px] shrink-0 flex-col bg-[#f9f9ff] text-[#071c36] font-['Plus_Jakarta_Sans'] border-r-2 border-[#000615]">
      {/* Header - Desktop specific within sidebar if used in desktop layout */}
      <div className="hidden md:flex p-6 border-b-2 border-[#000615] bg-[#0B1F3A] items-center gap-4 shadow-[4px_4px_0px_0px_#000]">
        <span className="material-symbols-outlined text-[#F5A623]">chat_bubble</span>
        <h2 className="text-xl font-black text-[#F5A623] font-['Space_Grotesk'] uppercase tracking-tighter">Messages</h2>
      </div>

      {/* Search Section */}
      <div className="p-4 bg-white border-b-2 border-[#000615]">
        <div className="relative group">
          <div className="flex items-center bg-white border-2 border-[#000615] shadow-[4px_4px_0px_0px_rgba(0,6,21,1)] focus-within:shadow-[4px_4px_0px_0px_#F5A623] transition-all">
            <div className="pl-4 text-[#000615]">
              <span className="material-symbols-outlined text-sm font-bold">search</span>
            </div>
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 font-bold text-[10px] uppercase tracking-widest p-3 placeholder:text-[#000615]/20" 
              placeholder="SEARCH CONVERSATIONS..." 
              type="text"
            />
          </div>
        </div>
      </div>

      {/* Status filter chips - Optional but kept for utility, redesigned */}
      <div className="flex flex-wrap gap-2 px-4 py-3 bg-[#f0f3ff] border-b-2 border-[#000615]">
        <StatusChip
          label="All"
          active={statusFilter === 'ALL'}
          onClick={() => setStatusFilter('ALL')}
        />
        {ALL_STATUSES.map((s) => (
          <StatusChip
            key={s}
            label={STATUS_LABELS[s]}
            active={statusFilter === s}
            onClick={() => setStatusFilter(statusFilter === s ? 'ALL' : s)}
          />
        ))}
      </div>

      {/* Conversation list */}
      <nav className="min-h-0 flex-1 overflow-y-auto no-scrollbar py-4 px-4 space-y-4">
        {filtered.length === 0 ? (
          <div className="py-12 flex flex-col items-center text-center">
            <div className="bg-[#f0f3ff] border-2 border-[#000615] p-6 mb-4 shadow-[4px_4px_0px_0px_rgba(0,6,21,1)]">
                <span className="material-symbols-outlined text-4xl text-[#000615]">chat_bubble_outline</span>
            </div>
            <h2 className="font-['Space_Grotesk'] font-black text-sm uppercase text-[#000615]">No Entries</h2>
          </div>
        ) : (
          <ul className="space-y-4">
            {filtered.map((row) => {
              const href = `${normalizedBase}/${row.bookingId}`
              const active = pathname === href || pathname.startsWith(`${href}/`)
              const unreadCount = row.unreadCount
              const unreadLabel = formatUnreadBadge(unreadCount)

              return (
                <li key={row.bookingId}>
                  <Link
                    href={href}
                    className={cn(
                      'block relative bg-white border-2 border-[#000615] transition-all cursor-pointer group',
                      active 
                        ? 'translate-x-[2px] translate-y-[2px] shadow-[4px_4px_0px_0px_#F5A623]' 
                        : 'shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000]'
                    )}
                  >
                    <div className={cn("flex p-4 gap-4", !active && unreadCount === 0 && "bg-[#f0f3ff]/50")}>
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className={cn(
                          "w-14 h-14 border-2 border-[#000615] flex items-center justify-center font-['Space_Grotesk'] font-black text-lg shadow-[2px_2px_0px_0px_#000]",
                          unreadCount > 0 ? "bg-[#feae2c] text-[#000615]" : "bg-white text-[#000615]/40 grayscale"
                        )}>
                           {initials(row.otherPartyName)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-[#feae2c] border-2 border-[#000615] p-0.5 shadow-[1px_1px_0px_0px_#000]">
                          <span className="material-symbols-outlined text-[10px] text-[#000615] font-black leading-none">
                             {row.status === 'CONFIRMED' ? 'electric_car' : 'history'}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <h3 className={cn(
                            "font-['Space_Grotesk'] font-black text-base uppercase leading-none truncate",
                            unreadCount > 0 ? "text-[#000615]" : "text-[#000615]/60"
                          )}>
                            {row.otherPartyName}
                          </h3>
                          <span className="font-bold text-[9px] text-[#000615]/40 uppercase shrink-0 ml-2">
                            {relativeTime(row.lastMessageAt ?? row.pickupAt)}
                          </span>
                        </div>
                        <p className={cn(
                          "font-bold text-[9px] uppercase tracking-tight mb-1",
                          unreadCount > 0 ? "text-[#feae2c]" : "text-[#000615]/20"
                        )}>
                          {row.vehicleName}
                        </p>
                        <p className={cn(
                          "text-xs truncate font-medium",
                          unreadCount > 0 ? "text-[#000615] font-bold" : "text-[#000615]/50"
                        )}>
                          {row.lastMessagePreview || 'New inquiry received.'}
                        </p>
                      </div>

                      {unreadCount > 0 && (
                        <div className="flex flex-col items-end justify-center ml-2">
                          <div className="w-6 h-6 bg-[#feae2c] border-2 border-[#000615] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,6,21,1)]">
                            <span className="font-['Space_Grotesk'] font-black text-[10px] text-[#000615]">{unreadLabel}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </nav>
    </aside>
  )
}

function StatusChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-1.5 border-2 text-[9px] font-black uppercase tracking-widest transition-all active:translate-y-0.5',
        active
          ? 'bg-[#000615] text-white border-[#000615] shadow-[2px_2px_0px_0px_#F5A623]'
          : 'bg-white text-[#000615] border-[#000615] shadow-[2px_2px_0px_0px_#000] hover:translate-y-[-1px]'
      )}
    >
      {label}
    </button>
  )
}
