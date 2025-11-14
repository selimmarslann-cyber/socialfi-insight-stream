import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readEnv, isSupabaseConfigured } from '@/lib/safeEnv'

export const SUPABASE_ENV_WARNING =
  'Supabase is not configured. Admin: add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to the environment variables.'

let client: SupabaseClient | null = null
let warned = false

export function getSupabase(): SupabaseClient | null {
  if (client) return client
  const { url, anon } = readEnv()
  if (!url || !anon) {
    if (!warned && typeof console !== 'undefined') {
      console.warn('[Supabase] missing configuration. ' + SUPABASE_ENV_WARNING)
      warned = true
    }
    return null
  }
  client = createClient(url as string, anon as string, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  return client
}

// backward compatibility (default export varsa)
export const supabase = getSupabase()

export { isSupabaseConfigured }
