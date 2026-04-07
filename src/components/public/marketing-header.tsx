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
    <header className="fixed top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 h-16 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-extrabold tracking-tight text-primary shrink-0"
        >
          RentNowPk
        </Link>

        {/* Center nav */}
        <nav
          className="hidden md:flex items-center gap-8"
          aria-label="Main"
        >
          <Link
            href="/search"
            className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
          >
            Explore
          </Link>
          <Link
            href="/for-vendors"
            className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
          >
            List your car
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <span
                className="hidden max-w-[140px] truncate text-sm text-gray-600 lg:inline"
                title={user.email}
              >
                {user.fullName}
              </span>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-9 rounded-full text-sm font-medium border-gray-300"
              >
                <Link href={defaultPathForRole(user.role as AppRole)}>
                  <span className="hidden sm:inline">{dashboardLabel(user.role as AppRole)}</span>
                  <span className="sm:hidden">Dashboard</span>
                </Link>
              </Button>
              <form action={logoutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="h-9 text-sm text-gray-600"
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
                className="h-9 rounded-full px-4 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="h-9 rounded-full px-5 text-sm font-semibold bg-primary hover:bg-primary/90 text-white"
              >
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
