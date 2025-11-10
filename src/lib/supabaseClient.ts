import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readEnv, isSupabaseConfigured } from '@/lib/safeEnv'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (client) return client
  if (!isSupabaseConfigured()) return null
  const { url, anon } = readEnv()
  if (!url || !anon) return null
  client = createClient(url as string, anon as string, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  return client
}

// backward compatibility (default export varsa)
export const supabase = getSupabase()

export { isSupabaseConfigured } from '@/lib/safeEnv'
