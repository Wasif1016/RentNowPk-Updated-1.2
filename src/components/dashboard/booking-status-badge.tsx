import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  CONFIRMED: { label: 'Active', cls: 'bg-green-50 text-green-700 border-green-200' },
  COMPLETED: { label: 'Completed', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-gray-50 text-gray-600 border-gray-200' },
  EXPIRED: { label: 'Expired', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
}

export function BookingStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    cls: 'bg-gray-50 text-gray-600 border-gray-200',
  }

  return (
    <Badge
      variant="secondary"
      className={cn('border font-medium', config.cls)}
    >
      {config.label}
    </Badge>
  )
}
