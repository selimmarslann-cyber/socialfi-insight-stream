import { supabase } from '@/lib/supabaseClient'

export type Period = 'daily' | 'weekly' | 'total'
export type TopRow = {
  user_id: string
  profiles: { username: string | null } | null
  total_score: number
  daily_score: number
  weekly_score: number
}

export async function fetchTopUsers(period: Period, limit = 5): Promise<TopRow[]> {
  const sortCol = period === 'daily' ? 'daily_score' : period === 'weekly' ? 'weekly_score' : 'total_score'
  const { data, error } = await supabase
    .from('gaming_scores')
    .select('user_id,total_score,daily_score,weekly_score,profiles(username)')
    .order(sortCol, { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data || []) as any
}

export function formatIdShort(uid: string) {
  return `${uid.slice(0, 4)}…${uid.slice(-4)}`
}
