import type { Metadata } from "next"
import { MarketingFooter } from "@/components/public/marketing-footer"
import { MarketingHeader } from "@/components/public/marketing-header"

export const metadata: Metadata = {
  title: "RentNowPk — Car rental marketplace",
  description: "Find and book rental vehicles from verified vendors across Pakistan.",
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  )
}
