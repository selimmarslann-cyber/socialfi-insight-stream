import { getSupabase } from '@/lib/supabaseClient'

export async function getUserSafe() {
  const sb = getSupabase()
  if (!sb) return { user: null }
  try {
    const { data } = await sb.auth.getUser()
    return { user: data?.user ?? null }
  } catch {
    return { user: null }
  }
}
