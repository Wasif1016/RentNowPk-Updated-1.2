/** Normalize FormData values for Zod (avoids `null` from missing fields). */
export function formString(formData: FormData, key: string): string {
  const v = formData.get(key)
  if (v == null) return ''
  return typeof v === 'string' ? v : ''
}
