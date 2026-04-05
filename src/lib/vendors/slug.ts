import { and, eq, ne } from 'drizzle-orm'
import { db } from '@/lib/db'
import { vendorProfiles } from '@/lib/db/schema'

type DbOrTx = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db

/**
 * URL-safe slug from business name. Not globally unique until
 * {@link ensureUniqueVendorPublicSlug} runs.
 */
export function slugifyVendorBase(businessName: string): string {
  const slug = businessName
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return slug || 'vendor'
}

/**
 * Globally unique `public_slug` for `vendor_profiles`.
 */
export async function ensureUniqueVendorPublicSlug(
  dbOrTx: DbOrTx,
  base: string,
  excludeVendorProfileId?: string
): Promise<string> {
  for (let i = 0; i < 500; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`
    const conditions = excludeVendorProfileId
      ? and(
          eq(vendorProfiles.publicSlug, candidate),
          ne(vendorProfiles.id, excludeVendorProfileId)
        )
      : eq(vendorProfiles.publicSlug, candidate)
    const [row] = await dbOrTx
      .select({ id: vendorProfiles.id })
      .from(vendorProfiles)
      .where(conditions)
      .limit(1)
    if (!row) return candidate
  }
  throw new Error('Could not allocate a unique vendor public slug.')
}

/** Default slug for trigger/bootstrap when only business name is known. */
export function defaultPublicSlugFromBusinessName(
  businessName: string,
  userIdSuffix: string
): string {
  const base = slugifyVendorBase(businessName)
  const suffix = userIdSuffix.replace(/-/g, '').slice(0, 12)
  return `${base}-${suffix}`.slice(0, 120)
}
