import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardStatCardProps {
  label: string
  value: string
  subtitle?: string
  icon: LucideIcon
  className?: string
}

export function DashboardStatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  className,
}: DashboardStatCardProps) {
  return (
    <div className={cn(
      "bg-white border-2 border-[#000615] p-5 shadow-[4px_4px_0px_0px_#000615] flex flex-col transition-all duration-200 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none rounded-none",
      className
    )}>
      <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-[#000615]/40 uppercase tracking-widest leading-none">
        <p>{label}</p>
        <div className="h-8 w-8 border-2 border-[#000615] flex items-center justify-center text-[#0B1F3A] bg-[#feae2c] shadow-[1px_1px_0px_0px_#000] rounded-none">
          <Icon className="h-4 w-4" strokeWidth={3} />
        </div>
      </div>
      <div className="flex flex-col">
        <p className="text-3xl font-bold text-[#000615] tracking-tighter leading-none mb-1.5 uppercase">{value}</p>
        {subtitle && (
          <p className="text-[9px] font-normal text-[#000615]/60 uppercase tracking-widest leading-none">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
