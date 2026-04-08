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
    <header className="fixed top-0 z-50 w-full bg-[#0B1F3A] border-b border-[rgba(255,255,255,0.08)]">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 h-16 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-[0.05em] text-[#F5A623] shrink-0"
        >
          RENTNOWPK
        </Link>

        {/* Center nav */}
        <nav
          className="hidden md:flex items-center gap-8"
          aria-label="Main"
        >
          <Link
            href="/search"
            className="text-xs font-bold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.6)] hover:text-[#F5A623] transition-colors"
          >
            Cars
          </Link>
          <Link
            href="/for-vendors"
            className="text-xs font-bold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.6)] hover:text-[#F5A623] transition-colors"
          >
            List your car
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <span
                className="hidden max-w-[140px] truncate text-xs text-[rgba(255,255,255,0.6)] lg:inline"
                title={user.email}
              >
                {user.fullName}
              </span>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-9 rounded-lg text-xs font-bold uppercase tracking-[0.05em] bg-[#F5A623] text-black border-none hover:bg-[#D4880F]"
              >
                <Link href={defaultPathForRole(user.role as AppRole)}>
                  Dashboard
                </Link>
              </Button>
              <form action={logoutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs text-[rgba(255,255,255,0.6)] hover:text-[#F5A623]"
                >
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-9 rounded-lg px-4 text-xs font-bold uppercase tracking-[0.05em] text-[rgba(255,255,255,0.6)] hover:text-[#F5A623]"
              >
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="h-9 rounded-lg px-5 text-xs font-bold uppercase tracking-[0.05em] bg-[#F5A623] text-black border-none hover:bg-[#D4880F]"
              >
                <Link href="/auth/signup">List your car</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
