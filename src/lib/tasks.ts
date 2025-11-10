import { supabase } from '@/lib/supabaseClient'
import type { BoostKey } from '@/types/rewards'

interface TaskDetectionResult {
  ok: boolean
  ts: string | null
  meta?: Record<string, unknown>
}

export async function detectCompletion(task: BoostKey, uid: string): Promise<TaskDetectionResult> {
  if (!supabase) {
    throw new Error('Supabase yapılandırılmadı')
  }

  if (task === 'deposit') {
    const { data: pf } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('id', uid)
      .single()
    if (!pf?.wallet_address) return { ok: false, ts: null }
    const { data: rows, error } = await supabase
      .from('investment_orders')
      .select('amount_nop')
      .eq('user_id', uid)
      .eq('type', 'buy')
    if (error) return { ok: false, ts: null }
    const sum = (rows || []).reduce((a, r) => a + Number(r.amount_nop || 0), 0)
    return { ok: sum >= 5000, ts: sum >= 5000 ? new Date().toISOString() : null, meta: { sum } }
  }

  return { ok: false, ts: null }
}
