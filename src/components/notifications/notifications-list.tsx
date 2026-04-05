'use client'

import { format, isSameDay } from 'date-fns'
import Link from 'next/link'
import { markNotificationRead } from '@/lib/actions/notifications'
import type { NotificationRow } from '@/lib/actions/notifications'

type Props = {
  notifications: NotificationRow[]
}

const TYPE_LABEL: Record<string, string> = {
  BOOKING: 'Booking',
  MESSAGE: 'Message',
  VERIFICATION: 'Verification',
  CONTACT_FLAG: 'Safety',
  REVIEW: 'Review',
  SYSTEM: 'System',
}

function NotificationIcon({ type }: { type: string }) {
  return (
    <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
      <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
        {TYPE_LABEL[type]?.[0] ?? 'N'}
      </div>
    </div>
  )
}

function getDateLabel(date: Date): string {
  if (isSameDay(date, new Date())) return 'Today'
  const yesterday = new Date(Date.now() - 86400000)
  if (isSameDay(date, yesterday)) return 'Yesterday'
  return format(date, 'MMMM d, yyyy')
}

export function NotificationsList({ notifications }: Props) {
  if (notifications.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-border bg-card px-4 py-12 text-center text-sm">
        No notifications yet.
      </p>
    )
  }

  let lastDate: Date | null = null

  return (
    <ul className="border-border divide-border divide-y rounded-xl border bg-card">
      {notifications.map((n) => {
        const date = new Date(n.createdAt)
        const showDate = !lastDate || !isSameDay(lastDate, date)
        lastDate = date

        return (
          <li key={n.id}>
            {showDate ? (
              <div className="bg-muted/50 px-4 py-1.5">
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  {getDateLabel(date)}
                </span>
              </div>
            ) : null}
            <div className={`flex items-start gap-3 px-4 py-3 ${!n.isRead ? 'bg-primary/5' : ''}`}>
              <NotificationIcon type={n.type} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-foreground text-sm font-medium">{n.title}</p>
                  {!n.isRead ? (
                    <button
                      type="button"
                      onClick={() => { void markNotificationRead(n.id) }}
                      className="text-muted-foreground hover:text-foreground text-xs underline"
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
                {n.body ? (
                  <p className="text-muted-foreground mt-0.5 text-sm">{n.body}</p>
                ) : null}
                {n.actionUrl ? (
                  <Link
                    href={n.actionUrl}
                    className="text-primary hover:underline mt-1 inline-block text-xs"
                  >
                    View
                  </Link>
                ) : null}
                <p className="text-muted-foreground mt-1 text-xs">
                  {format(date, 'h:mm a')}
                </p>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
