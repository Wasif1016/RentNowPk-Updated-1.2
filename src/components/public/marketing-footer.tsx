import Link from "next/link"
import { defaultPathForRole, type AppRole } from "@/lib/auth/safe-next"
import { getOptionalUser } from "@/lib/auth/session"

export async function MarketingFooter() {
  const user = await getOptionalUser()

  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-lg font-extrabold text-primary tracking-tight">RentNowPk</p>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              The smarter way to rent a car in Pakistan.
            </p>
          </div>

          {/* Explore */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">Explore</p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/search" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Search vehicles
                </Link>
              </li>
              <li>
                <Link href="/for-vendors" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  List your car
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">Account</p>
            <ul className="space-y-2.5">
              {user ? (
                <>
                  <li>
                    <Link
                      href={defaultPathForRole(user.role as AppRole)}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <span className="text-sm text-gray-400">{user.email}</span>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                      Log in
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth/signup" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                      Sign up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">Support</p>
            <ul className="space-y-2.5">
              <li>
                <span className="text-sm text-gray-500">help@rentnowpk.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200">
          <p className="text-center text-xs text-gray-400">
            © {new Date().getFullYear()} RentNowPk. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
