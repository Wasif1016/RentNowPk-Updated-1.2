import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center px-4 py-1.5 border-2 border-primary text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_#000] rounded-none select-none",
  {
    variants: {
      variant: {
        pending: "bg-secondary-container text-primary",
        confirmed: "bg-[#7ffc97] text-primary",
        cancelled: "bg-destructive/20 text-destructive",
        active: "bg-accent text-primary",
        default: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {}

export function StatusBadge({ className, variant, ...props }: StatusBadgeProps) {
  return (
    <div
      className={cn(statusBadgeVariants({ variant }), className)}
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      {...props}
    />
  )
}
