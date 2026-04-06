import type { ComponentProps } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Calendar03Icon,
  Car01Icon,
  Chat01Icon,
  DashboardSquare01Icon,
  Settings01Icon,
  User02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

type Hugeicon = NonNullable<ComponentProps<typeof HugeiconsIcon>["icon"]>

export type DashboardNavItem = {
  href: string
  label: string
  icon: Hugeicon
}

export const VENDOR_NAV: DashboardNavItem[] = [
  { href: "/vendor", label: "Dashboard", icon: DashboardSquare01Icon },
  { href: "/vendor/vehicles", label: "Vehicles", icon: Car01Icon },
  { href: "/vendor/vehicles/add", label: "Add vehicle", icon: Add01Icon },
  { href: "/vendor/bookings", label: "Bookings", icon: Calendar03Icon },
  { href: "/vendor/chat", label: "Messages", icon: Chat01Icon },
  { href: "/vendor/profile", label: "Profile", icon: User02Icon },
]

export const CUSTOMER_NAV: DashboardNavItem[] = [
  { href: "/customer", label: "Dashboard", icon: DashboardSquare01Icon },
  { href: "/customer/bookings", label: "Bookings", icon: Calendar03Icon },
  { href: "/customer/chat", label: "Messages", icon: Chat01Icon },
  { href: "/customer/settings", label: "Settings", icon: Settings01Icon },
]

export const ADMIN_NAV: DashboardNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: DashboardSquare01Icon },
  { href: "/admin/vendors", label: "Vendors", icon: UserGroupIcon },
  { href: "/admin/bookings", label: "Bookings", icon: Calendar03Icon },
  { href: "/admin/chat", label: "Messages", icon: Chat01Icon },
  { href: "/admin/settings", label: "Settings", icon: Settings01Icon },
]

export function isDashboardNavActive(pathname: string, href: string): boolean {
  const roots = ["/vendor", "/customer", "/admin"] as const
  if ((roots as readonly string[]).includes(href)) {
    return pathname === href
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
