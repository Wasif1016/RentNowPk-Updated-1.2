export type AppRole = 'CUSTOMER' | 'VENDOR' | 'ADMIN'

const ROLE_HOME: Record<AppRole, string> = {
  CUSTOMER: '/customer',
  VENDOR: '/vendor',
  ADMIN: '/admin',
}

/** Dashboard areas — role checks apply in {@link resolveRedirectAfterLogin}. */
const DASHBOARD_PREFIXES = ['/vendor', '/customer', '/admin'] as const

/** First path segment cannot be these if the URL is a public `/{vendorSlug}/{vehicleSlug}` pattern. */
const RESERVED_ROOT_SEGMENTS = new Set(
  [
    'vendor',
    'customer',
    'admin',
    'auth',
    'api',
    'search',
    'for-vendors',
    '_next',
    'ingest',
    'static',
  ].map((s) => s.toLowerCase())
)

const SLUG_SEGMENT = /^[a-z0-9][a-z0-9-]{0,118}$/

/**
 * Two-segment paths like `/lahore-cars/toyota-camry-2020` (public vehicle pages).
 */
function isPublicVehicleStylePath(path: string): boolean {
  const parts = path.split('/').filter(Boolean)
  if (parts.length !== 2) return false
  const [a, b] = parts
  if (RESERVED_ROOT_SEGMENTS.has(a.toLowerCase())) return false
  return SLUG_SEGMENT.test(a) && SLUG_SEGMENT.test(b)
}

function isAllowedPublicPath(path: string): boolean {
  if (path === '/') return true
  if (path === '/for-vendors') return true
  if (path === '/search' || path.startsWith('/search/')) return true
  if (path.startsWith('/auth/')) return true
  if (isPublicVehicleStylePath(path)) return true
  return false
}

function isAllowedDashboardPath(path: string): boolean {
  return DASHBOARD_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

/**
 * Returns a safe same-origin path or `fallback` if the value is missing or unsafe.
 * Allows dashboard routes, marketing pages (`/`, `/search`, `/for-vendors`, `/auth/*`),
 * and public vehicle URLs `/{vendorSlug}/{vehicleSlug}`.
 */
export function sanitizeNextPath(input: string | null | undefined, fallback: string): string {
  if (!input || typeof input !== 'string') return fallback
  let path = input.trim()
  try {
    path = decodeURIComponent(path)
  } catch {
    return fallback
  }
  const q = path.indexOf('?')
  if (q >= 0) path = path.slice(0, q)
  if (!path.startsWith('/') || path.startsWith('//')) return fallback
  if (path.includes('//')) return fallback

  if (isAllowedDashboardPath(path) || isAllowedPublicPath(path)) return path
  return fallback
}

export function defaultPathForRole(role: AppRole): string {
  return ROLE_HOME[role] ?? '/vendor'
}

export function resolveRedirectAfterLogin(role: AppRole, next: string | null | undefined): string {
  const fb = defaultPathForRole(role)
  const candidate = sanitizeNextPath(next, fb)

  const isVendorArea = candidate.startsWith('/vendor')
  const isCustomerArea = candidate.startsWith('/customer')
  const isAdminArea = candidate.startsWith('/admin')

  if (role === 'VENDOR' && (isCustomerArea || isAdminArea)) return fb
  if (role === 'CUSTOMER' && (isVendorArea || isAdminArea)) return fb
  if (role === 'ADMIN' && (isVendorArea || isCustomerArea)) return fb

  return candidate
}
