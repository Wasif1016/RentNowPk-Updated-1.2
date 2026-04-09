import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface IndustrialCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  contentClassName?: string
}

export function IndustrialCard({
  title,
  subtitle,
  icon,
  className,
  contentClassName,
  children,
  ...props
}: IndustrialCardProps) {
  return (
    <Card className={cn("transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,21,1)] bg-white border-2 border-primary rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]", className)} {...props}>
      {(title || icon) && (
        <div className="px-6 py-4 border-b-2 border-primary bg-[#f0f3ff] flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-bold tracking-widest text-primary uppercase">{title}</h3>}
            {subtitle && <p className="text-[10px] font-bold uppercase text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {icon && <div className="text-primary">{icon}</div>}
        </div>
      )}
      <CardContent className={cn("p-6", (title || icon) && "pt-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
