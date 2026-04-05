import Link from "next/link"
import { defaultPathForRole, type AppRole } from "@/lib/auth/safe-next"
import { getOptionalUser } from "@/lib/auth/session"

export async function MarketingFooter() {
  const user = await getOptionalUser()

  return (
    <footer className="border-border mt-auto border-t bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-foreground font-semibold">RentNowPk</p>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Find and book rental vehicles from verified vendors across Pakistan.
            </p>
          </div>
          <div>
            <p className="text-foreground text-sm font-medium">Explore</p>
            <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
              <li>
                <Link href="/search" className="hover:text-foreground transition-colors">
                  Search vehicles
                </Link>
              </li>
              <li>
                <Link href="/for-vendors" className="hover:text-foreground transition-colors">
                  Become a vendor
                </Link>
              </li>
              {user ? (
                <li>
                  <Link
                    href={defaultPathForRole(user.role as AppRole)}
                    className="hover:text-foreground transition-colors"
                  >
                    Your dashboard
                  </Link>
                </li>
              ) : (
                <li>
                  <Link href="/auth/login" className="hover:text-foreground transition-colors">
                    Log in
                  </Link>
                </li>
              )}
            </ul>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-foreground text-sm font-medium">Account</p>
            <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
              {user ? (
                <>
                  <li>
                    <span className="text-foreground/80">{user.email}</span>
                  </li>
                  <li>
                    <Link
                      href={defaultPathForRole(user.role as AppRole)}
                      className="hover:text-foreground transition-colors"
                    >
                      Open dashboard
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/auth/login" className="hover:text-foreground transition-colors">
                      Log in
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth/signup" className="hover:text-foreground transition-colors">
                      Create vendor account
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
        <p className="text-muted-foreground mt-10 border-t border-border pt-6 text-center text-xs">
          © {new Date().getFullYear()} RentNowPk. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
