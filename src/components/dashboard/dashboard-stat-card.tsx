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
      "bg-white border-2 border-[#0B1B3D] p-5 rounded-md shadow-[4px_4px_0_#0F1E32] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#0F1E32]",
      className
    )}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#0B1B3D]/50 mb-1 leading-none">
            {label}
          </p>
          <p className="text-3xl font-black text-[#0B1B3D] tracking-tighter tabular-nums leading-none mb-2">
            {value}
          </p>
          {subtitle && (
            <p className="text-[10px] font-bold text-[#0B1B3D]/40 uppercase tracking-tight leading-none">
              {subtitle}
            </p>
          )}
        </div>
        <div className="bg-[#F5A623] border-2 border-[#0B1B3D] p-2 rounded-sm shadow-[2px_2px_0_#0B1B3D] shrink-0">
          <Icon className="h-5 w-5 text-[#0B1B3D]" strokeWidth={3} />
        </div>
      </div>
    </div>
  )
}
