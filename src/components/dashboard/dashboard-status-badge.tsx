import { cn } from '@/lib/utils'

interface DashboardStatusBadgeProps {
  status: string
  className?: string
}

export function DashboardStatusBadge({ status, className }: DashboardStatusBadgeProps) {
  const map: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    PENDING: { 
      label: 'Pending', 
      bg: 'bg-amber-50', 
      text: 'text-amber-700', 
      dot: 'bg-amber-500' 
    },
    CONFIRMED: { 
      label: 'Active', 
      bg: 'bg-[#F5A623]/10', 
      text: 'text-[#F5A623]', 
      dot: 'bg-[#F5A623]' 
    },
    COMPLETED: { 
      label: 'Completed', 
      bg: 'bg-blue-50', 
      text: 'text-blue-700', 
      dot: 'bg-blue-500' 
    },
    REJECTED: { 
      label: 'Rejected', 
      bg: 'bg-red-50', 
      text: 'text-red-700', 
      dot: 'bg-red-500' 
    },
    CANCELLED: { 
      label: 'Cancelled', 
      bg: 'bg-gray-100', 
      text: 'text-gray-600', 
      dot: 'bg-gray-400' 
    },
    EXPIRED: { 
      label: 'Expired', 
      bg: 'bg-gray-200', 
      text: 'text-gray-500', 
      dot: 'bg-gray-500' 
    },
  }

  const s = map[status] ?? { 
    label: status, 
    bg: 'bg-gray-50', 
    text: 'text-gray-600', 
    dot: 'bg-gray-400' 
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 border-2 border-[#0B1B3D] rounded-full text-[9px] font-black uppercase tracking-wider shadow-[2px_2px_0_#0F1E32]",
      s.bg,
      s.text,
      className
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", s.dot)} />
      {s.label}
    </div>
  )
}
