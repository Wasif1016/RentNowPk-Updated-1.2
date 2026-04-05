import { z } from 'zod'
import { isWithinPakistanBounds } from '@/lib/geo/bounds'

const CURRENT_YEAR = new Date().getFullYear()

/** Positive decimal string for DB `decimal` columns (PKR). */
const moneyString = z
  .string()
  .trim()
  .min(1, 'Enter a price.')
  .refine((s) => {
    const n = Number.parseFloat(s)
    return Number.isFinite(n) && n > 0 && n < 1e10
  }, 'Enter a valid amount.')

export const createVehicleFieldsSchema = z
  .object({
    name: z.string().trim().min(1, 'Vehicle name is required.').max(200),
    make: z.string().trim().min(1, 'Make is required.').max(120),
    model: z.string().trim().min(1, 'Model is required.').max(120),
    year: z.coerce
      .number()
      .int()
      .min(1990, 'Year is too old.')
      .max(CURRENT_YEAR + 1, 'Year is invalid.'),

    withDriverEnabled: z.boolean(),
    selfDriveEnabled: z.boolean(),

    priceWithDriverDay: z.string().optional(),
    priceWithDriverMonth: z.string().optional(),
    priceSelfDriveDay: z.string().optional(),
    priceSelfDriveMonth: z.string().optional(),

    /** Index of cover image in the submitted files array (0-based); capped in the action. */
    coverIndex: z.coerce.number().int().min(0),

    pickupLatitude: z
      .string()
      .trim()
      .min(1, 'Set a pickup location.')
      .transform((s) => Number.parseFloat(s))
      .pipe(z.number().finite().min(-90).max(90)),
    pickupLongitude: z
      .string()
      .trim()
      .min(1, 'Set a pickup location.')
      .transform((s) => Number.parseFloat(s))
      .pipe(z.number().finite().min(-180).max(180)),
    /** Google Place ID when user picked from search; empty if pin was adjusted manually. */
    pickupPlaceId: z.string().trim().optional(),
    /** Client display string; server may replace after Place Details / geocode. */
    pickupFormattedAddress: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      !isWithinPakistanBounds(data.pickupLatitude, data.pickupLongitude)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pickup must be within Pakistan.',
        path: ['pickupLatitude'],
      })
    }
    if (!data.withDriverEnabled && !data.selfDriveEnabled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enable at least one drive type.',
        path: ['withDriverEnabled'],
      })
    }

    if (data.withDriverEnabled) {
      const d = data.priceWithDriverDay
      const m = data.priceWithDriverMonth
      const dayOk = d !== undefined && moneyString.safeParse(d).success
      const monthOk = m !== undefined && moneyString.safeParse(m).success
      if (!dayOk) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter price per day.',
          path: ['priceWithDriverDay'],
        })
      }
      if (!monthOk) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter price per month.',
          path: ['priceWithDriverMonth'],
        })
      }
    }

    if (data.selfDriveEnabled) {
      const d = data.priceSelfDriveDay
      const m = data.priceSelfDriveMonth
      const dayOk = d !== undefined && moneyString.safeParse(d).success
      const monthOk = m !== undefined && moneyString.safeParse(m).success
      if (!dayOk) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter price per day.',
          path: ['priceSelfDriveDay'],
        })
      }
      if (!monthOk) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter price per month.',
          path: ['priceSelfDriveMonth'],
        })
      }
    }
  })

export type CreateVehicleFieldsInput = z.infer<typeof createVehicleFieldsSchema>

/** Normalize money to two decimal places as string for Drizzle decimal columns. */
export function normalizeMoneyString(raw: string): string {
  const n = Number.parseFloat(raw.trim())
  return n.toFixed(2)
}

/** Deduplicate cities case-insensitively; preserve first casing. */
export function dedupeCities(cities: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const c of cities) {
    const t = c.trim()
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
  }
  return out
}
