'use client'

import { format } from 'date-fns'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  const [statusFilter, setStatusFilter] = useState<BookingListRow['status'] | 'ALL'>(
    'ALL'
  )

  const filtered = rows.filter((row) => {
    const matchSearch =
      !search.trim() ||
      row.otherPartyName.toLowerCase().includes(search.toLowerCase().trim()) ||
      row.vehicleName.toLowerCase().includes(search.toLowerCase().trim())
    const matchStatus =
      statusFilter === 'ALL' || row.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <aside className="border-border bg-muted/30 flex w-full max-w-[min(100%,280px)] shrink-0 flex-col border-r">
      <div className="border-border border-b px-3 py-2">
        <p className="text-foreground text-xs font-semibold tracking-wide uppercase">
          Conversations
        </p>
        <p className="text-muted-foreground text-[11px]">
          {rows.length} booking{rows.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Search + filter bar */}
      <div className="border-border flex flex-col gap-1 border-b p-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations…"
          className="h-7 text-xs"
          aria-label="Search conversations"
        />
        <div className="flex flex-wrap gap-1">
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
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground px-3 py-4 text-xs">
            {rows.length === 0
              ? 'No conversations yet.'
              : 'No matches for this filter.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5 p-1.5">
            {filtered.map((row) => {
              const href = `${normalizedBase}/${row.bookingId}`
              const active =
                pathname === href || pathname.startsWith(`${href}/`)
              const unreadLabel = formatUnreadBadge(row.unreadCount)
              return (
                <li key={row.bookingId}>
                  <Link
                    href={href}
                    className={cn(
                      'hover:bg-muted/80 flex flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                      active
                        ? 'bg-muted text-foreground ring-1 ring-border'
                        : 'text-muted-foreground'
                    )}
                  >
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <span className="text-foreground line-clamp-1 text-sm font-medium">
                        {row.otherPartyName}
                      </span>
                      {unreadLabel ? (
                        <Badge
                          variant="secondary"
                          className="shrink-0 tabular-nums"
                        >
                          {unreadLabel}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <span className="text-muted-foreground line-clamp-1 text-[11px]">
                        {row.lastMessagePreview || 'No messages yet'}
                      </span>
                      <span className="text-muted-foreground shrink-0 text-[10px]">
                        {format(row.lastMessageAt ?? row.pickupAt, 'd MMM')}
                      </span>
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
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      size="sm"
      className="h-5 px-1.5 text-[10px]"
      onClick={onClick}
    >
      {label}
    </Button>
  )
}
