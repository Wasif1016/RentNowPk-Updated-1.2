'use client'

import { format } from 'date-fns'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-amber-100 text-amber-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
  'bg-orange-100 text-orange-700',
]

function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
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
    <aside className="flex w-full max-w-[min(100%,320px)] shrink-0 flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="border-b border-border px-4 py-4">
        <p className="text-sm font-semibold text-foreground">Conversations</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {rows.length} booking{rows.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Search */}
      <div className="border-b border-border p-3">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="h-9 pl-9 text-sm rounded-xl bg-muted/50 border-border/50 focus:bg-background"
            aria-label="Search conversations"
          />
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-1.5 border-b border-border px-3 py-2">
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
      <nav className="min-h-0 flex-1 overflow-y-auto divide-y divide-border/50">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground px-4 py-6 text-xs text-center">
            {rows.length === 0 ? 'No conversations yet.' : 'No matches for this filter.'}
          </p>
        ) : (
          <ul>
            {filtered.map((row) => {
              const href = `${normalizedBase}/${row.bookingId}`
              const active = pathname === href || pathname.startsWith(`${href}/`)
              const unreadLabel = formatUnreadBadge(row.unreadCount)
              const color = avatarColor(row.otherPartyName)

              return (
                <li key={row.bookingId}>
                  <Link
                    href={href}
                    className={cn(
                      'flex gap-3 items-start p-4 transition-all cursor-pointer',
                      active
                        ? 'bg-gradient-to-r from-primary/5 to-transparent border-l-[3px] border-l-primary'
                        : 'hover:bg-muted/50 border-l-[3px] border-l-transparent'
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn('h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0', color)}>
                      {initials(row.otherPartyName)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="font-semibold text-foreground text-sm truncate">
                          {row.otherPartyName}
                        </p>
                        <span className="text-xs text-muted-foreground/60 shrink-0 ml-2">
                          {relativeTime(row.lastMessageAt ?? row.pickupAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {row.lastMessagePreview || row.vehicleName}
                      </p>
                      {unreadLabel ? (
                        <Badge
                          variant="default"
                          className="mt-1.5 text-[10px] px-1.5 py-0 h-4"
                        >
                          {unreadLabel}
                        </Badge>
                      ) : null}
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
        'px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors',
        active
          ? 'bg-primary text-white'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
      )}
    >
      {label}
    </button>
  )
}
