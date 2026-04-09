import { cn } from '@/lib/utils'

interface DashboardStatusBadgeProps {
  status: string
  className?: string
}

export function DashboardStatusBadge({ status, className }: DashboardStatusBadgeProps) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    PENDING: { 
      label: 'Pending', 
      bg: 'bg-secondary-container', 
      text: 'text-[#000615]'
    },
    CONFIRMED: { 
      label: 'Confirmed', 
      bg: 'bg-[#F5A623]', 
      text: 'text-[#0B1F3A]'
    },
    COMPLETED: { 
      label: 'Completed', 
      bg: 'bg-[#7ffc97]', 
      text: 'text-[#002109]'
    },
    REJECTED: { 
      label: 'Rejected', 
      bg: 'bg-[#ffdad6]', 
      text: 'text-[#ba1a1a]'
    },
    CANCELLED: { 
      label: 'Cancelled', 
      bg: 'bg-gray-100', 
      text: 'text-gray-600'
    },
    EXPIRED: { 
      label: 'Expired', 
      bg: 'bg-gray-200', 
      text: 'text-gray-500'
    },
  }

  const s = map[status] ?? { 
    label: status, 
    bg: 'bg-gray-50', 
    text: 'text-gray-600'
  }

  return (
    <div className={cn(
      "inline-flex items-center px-4 py-1.5 border-2 border-[#000615] text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#000]",
      s.bg,
      s.text,
      className
    )} style={{ fontFamily: 'Arial, sans-serif' }}>
      {s.label}
    </div>
  )
}
