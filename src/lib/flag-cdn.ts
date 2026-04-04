const FLAGCDN_ORIGIN = 'https://flagcdn.com'

/**
 * SVG flag URL from [flagcdn.com](https://flagcdn.com/) for an ISO 3166-1 alpha-2 code.
 * Example: `pk` → `https://flagcdn.com/pk.svg`
 *
 * @param iso3166Alpha2 — Two-letter country/region code (case-insensitive), e.g. `PK`, `ua`
 * @returns URL or empty string if the code is not two ASCII letters
 */
export function getFlagCdnSvgUrl(iso3166Alpha2: string): string {
  const code = iso3166Alpha2.trim().toLowerCase()
  if (code.length !== 2 || !/^[a-z]{2}$/.test(code)) {
    return ''
  }
  return `${FLAGCDN_ORIGIN}/${code}.svg`
}
