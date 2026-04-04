'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getFlagCdnSvgUrl } from '@/lib/flag-cdn'

type CountryFlagProps = {
  /** ISO 3166-1 alpha-2 code (e.g. PK, us) */
  code: string
  className?: string
}

/**
 * Renders a country flag from flagcdn.com SVGs. Decorative — use with a visible label nearby.
 */
export function CountryFlag({ code, className }: CountryFlagProps) {
  const src = getFlagCdnSvgUrl(code)
  if (!src) return null

  return (
    <Image
      src={src}
      alt=""
      width={24}
      height={18}
      unoptimized
      loading="lazy"
      className={cn('inline-block shrink-0 object-cover rounded-sm', className)}
    />
  )
}
