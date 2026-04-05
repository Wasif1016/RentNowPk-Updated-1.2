import { z } from 'zod'

const placeId = z.string().min(1).max(512)

export const SearchPageQuerySchema = z.object({
  pickupPlaceId: placeId.optional(),
  dropoffPlaceId: placeId.optional(),
  radiusKm: z.coerce.number().min(5).max(150).default(50),
})

export type SearchPageQuery = z.infer<typeof SearchPageQuerySchema>

function single(
  raw: Record<string, string | string[] | undefined>,
  k: string
): string | undefined {
  const v = raw[k]
  if (Array.isArray(v)) return v[0]
  return v
}

export function parseSearchPageQuery(
  raw: Record<string, string | string[] | undefined>
): SearchPageQuery {
  const parsed = SearchPageQuerySchema.safeParse({
    pickupPlaceId: single(raw, 'pickupPlaceId')?.trim() || undefined,
    dropoffPlaceId: single(raw, 'dropoffPlaceId')?.trim() || undefined,
    radiusKm: single(raw, 'radiusKm'),
  })
  if (parsed.success) return parsed.data
  return { radiusKm: 50 }
}
