import 'server-only'

import { cache } from 'react'
import { getTotalUnreadForUser } from '@/lib/db/chat-unread'

/**
 * Dedupes the unread query when layout + children run in the same request.
 * Intentionally NOT using `"use cache"` — unread is high-churn “live” data; Next.js
 * recommends dynamic fetches for this (see Cache Components: notifications pattern).
 * Cross-request caching made `updateTag`/`refresh` easy to get wrong with PPR.
 */
export const getCachedTotalUnreadForUser = cache(async (userId: string) => {
  return getTotalUnreadForUser(userId)
})
