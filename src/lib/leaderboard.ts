import { getSupabase } from '@/lib/supabaseClient'
export type Period = 'daily' | 'weekly' | 'total'
export async function fetchTopUsers(period: Period, limit = 5) {
  const sb = getSupabase()
  if (!sb) return []
  const col = period === 'daily' ? 'daily_score' : period === 'weekly' ? 'weekly_score' : 'total_score'
  const { data } = await sb
    .from('gaming_scores')
    .select('user_id,total_score,daily_score,weekly_score,profiles(username)')
    .order(col, { ascending: false })
    .limit(limit)
  return data || []
}
export function shortId(id: string) {
  return `${id.slice(0, 4)}…${id.slice(-4)}`
}
