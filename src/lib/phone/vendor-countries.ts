/**
 * Phone countries & E.164 parsing for vendor signup.
 * Data: libphonenumber-js (supported regions + validation) + i18n-iso-countries (English names).
 */

import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js'
import { getName, registerLocale, type LocaleData } from 'i18n-iso-countries'
import enLocale from 'i18n-iso-countries/langs/en.json'

registerLocale(enLocale as LocaleData)

export type PhoneCountryOption = {
  /** ISO 3166-1 alpha-2 (libphonenumber region) */
  code: string
  dial: string
  flag: string
  label: string
}

/** Default region — platform focus Pakistan */
export const DEFAULT_PHONE_COUNTRY = 'PK'

const FLAG_OFFSET = 127397

function flagEmoji(iso2: string): string {
  const a = iso2.toUpperCase()
  if (a.length !== 2) return ''
  return [...a].map((c) => String.fromCodePoint(FLAG_OFFSET + c.codePointAt(0)!)).join('')
}

let cachedOptions: PhoneCountryOption[] | null = null
let validCodes: ReadonlySet<string> | null = null

/**
 * All regions supported for phone parsing (typically 200+), Pakistan first then A–Z by name.
 */
export function getPhoneCountryOptions(): PhoneCountryOption[] {
  if (cachedOptions) return cachedOptions

  const codes = getCountries()
  validCodes = new Set(codes)

  const options: PhoneCountryOption[] = codes.map((code) => ({
    code,
    dial: getCountryCallingCode(code as CountryCode),
    flag: flagEmoji(code),
    label: getName(code, 'en') ?? code,
  }))

  options.sort((a, b) => {
    if (a.code === DEFAULT_PHONE_COUNTRY) return -1
    if (b.code === DEFAULT_PHONE_COUNTRY) return 1
    return a.label.localeCompare(b.label, 'en')
  })

  cachedOptions = options
  return cachedOptions
}

export function isValidPhoneCountryCode(code: string): boolean {
  if (!validCodes) getPhoneCountryOptions()
  return validCodes!.has(code.toUpperCase())
}

/**
 * National (or pasted international) input → E.164. Re-run on the server for every signup.
 */
export function parseLocalToE164(
  countryIso: string,
  raw: string
): { ok: true; e164: string } | { ok: false; message: string } {
  const upper = countryIso.trim().toUpperCase()
  if (!isValidPhoneCountryCode(upper)) {
    return { ok: false, message: 'Invalid country selection.' }
  }

  const cc = upper as CountryCode
  const trimmed = raw.trim()

  if (trimmed.startsWith('+')) {
    const p = parsePhoneNumberFromString(trimmed)
    if (p?.isValid()) return { ok: true, e164: p.format('E.164') }
    return { ok: false, message: 'Invalid international phone number.' }
  }

  const digits = raw.replace(/\D/g, '')

  let p =
    parsePhoneNumberFromString(trimmed, cc) ??
    parsePhoneNumberFromString(digits, cc)

  if (p?.isValid()) {
    return { ok: true, e164: p.format('E.164') }
  }

  const calling = getCountryCallingCode(cc)
  const synthetic = `+${calling}${digits}`
  p = parsePhoneNumberFromString(synthetic)
  if (p?.isValid()) {
    return { ok: true, e164: p.format('E.164') }
  }

  return {
    ok: false,
    message: 'Enter a valid phone number for the selected country.',
  }
}
