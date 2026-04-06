import { createClient as createSupabaseClient } from '@supabase/supabase-js'

let adminClient: ReturnType<typeof createSupabaseClient> | null = null

export function getSupabaseAdmin() {
  if (adminClient) return adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase URL or service role key not configured')
  }

  adminClient = createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}
