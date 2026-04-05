'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** Refetches server components when the tab becomes visible or the window gains focus (stale unread badges). */
export function UnreadBadgeRefreshOnFocus() {
  const router = useRouter()

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        router.refresh()
      }
    }
    const onFocus = () => {
      router.refresh()
    }
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', onFocus)
    }
  }, [router])

  return null
}
