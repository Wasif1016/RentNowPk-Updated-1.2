import { 
  LayoutDashboard, 
  Car, 
  PlusSquare, 
  Calendar, 
  MessageSquare, 
  Settings, 
  Users,
  LucideIcon 
} from "lucide-react"

export type DashboardNavItem = {
  href: string
  label: string
  iconName: string
}

export const VENDOR_NAV: DashboardNavItem[] = [
  { href: "/vendor", label: "Dashboard", iconName: "layout-dashboard" },
  { href: "/vendor/vehicles", label: "Vehicles", iconName: "car" },
  { href: "/vendor/vehicles/add", label: "Add vehicle", iconName: "plus-square" },
  { href: "/vendor/bookings", label: "Bookings", iconName: "calendar" },
  { href: "/vendor/chat", label: "Messages", iconName: "message-square" },
  { href: "/vendor/settings", label: "Settings", iconName: "settings" },
]

export const CUSTOMER_NAV: DashboardNavItem[] = [
  { href: "/customer", label: "Dashboard", iconName: "layout-dashboard" },
  { href: "/customer/bookings", label: "Bookings", iconName: "calendar" },
  { href: "/customer/chat", label: "Messages", iconName: "message-square" },
  { href: "/customer/settings", label: "Settings", iconName: "settings" },
]

export const ADMIN_NAV: DashboardNavItem[] = [
  { href: "/admin", label: "Dashboard", iconName: "layout-dashboard" },
  { href: "/admin/vendors", label: "Vendors", iconName: "users" },
  { href: "/admin/bookings", label: "Bookings", iconName: "calendar" },
  { href: "/admin/chat", label: "Messages", iconName: "message-square" },
  { href: "/admin/settings", label: "Settings", iconName: "settings" },
]

export function isDashboardNavActive(pathname: string, href: string): boolean {
  const roots = ["/vendor", "/customer", "/admin"] as const
  if ((roots as readonly string[]).includes(href)) {
    return pathname === href
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
