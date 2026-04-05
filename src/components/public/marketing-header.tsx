import Link from "next/link"
import { logoutAction } from "@/lib/actions/auth"
import { defaultPathForRole, type AppRole } from "@/lib/auth/safe-next"
import { getOptionalUser } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"

function dashboardLabel(role: AppRole): string {
  switch (role) {
    case "ADMIN":
      return "Admin"
    case "VENDOR":
      return "Vendor dashboard"
    case "CUSTOMER":
      return "My account"
    default:
      return "Dashboard"
  }
}

export async function MarketingHeader() {
  const user = await getOptionalUser()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16">
        <Link
          href="/"
          className="text-foreground shrink-0 text-lg font-semibold tracking-tight sm:text-xl"
        >
          RentNowPk
        </Link>

        <nav
          className="text-muted-foreground hidden items-center gap-6 text-sm font-medium md:flex"
          aria-label="Main"
        >
          <Link href="/search" className="hover:text-foreground transition-colors">
            Search
          </Link>
          <Link href="/for-vendors" className="hover:text-foreground transition-colors">
            For vendors
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <span
                className="text-muted-foreground hidden max-w-[140px] truncate text-xs sm:max-w-[200px] sm:text-sm lg:inline"
                title={user.email}
              >
                {user.fullName}
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link href={defaultPathForRole(user.role as AppRole)}>
                  <span className="hidden sm:inline">{dashboardLabel(user.role as AppRole)}</span>
                  <span className="sm:hidden">Dashboard</span>
                </Link>
              </Button>
              <form action={logoutAction}>
                <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/auth/signup">For vendors</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/signup-customer">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="border-border border-t md:hidden">
        <nav
          className="text-muted-foreground container mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 py-2 text-sm font-medium"
          aria-label="Mobile main"
        >
          <Link href="/search" className="hover:text-foreground shrink-0 transition-colors">
            Search
          </Link>
          <Link href="/for-vendors" className="hover:text-foreground shrink-0 transition-colors">
            For vendors
          </Link>
        </nav>
      </div>
    </header>
  )
}
