'use client'
import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { getUserSafe } from '@/lib/safeAuth'

type Task = { key: 'signup' | 'deposit' | 'contribute'; title: string; desc: string; reward: number; icon: string }
const TASKS: Task[] = [
  { key: 'signup', title: 'Üye ol', desc: 'Hesabını oluştur ve giriş yap.', reward: 2000, icon: '👤' },
  { key: 'deposit', title: 'Deposit / Buy NOP', desc: 'Cüzdanını bağla ve ≥ 5.000 NOP BUY işlemi yap.', reward: 5000, icon: '🔗🛒' },
  { key: 'contribute', title: 'Katkı yap', desc: 'Bir gönderi paylaş, topluluk puanlasın.', reward: 3000, icon: '✍️' },
]

function GoldChip({ children }: { children: any }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[12px] bg-[#F5C76A] text-[#0F172A] font-medium shadow-sm">{children}</span>
  )
}
function Pill({ children, tone = 'gray' }: { children: any; tone?: 'gray' | 'green' | 'red' }) {
  const map: any = { gray: 'bg-gray-100 text-gray-600', green: 'bg-emerald-100 text-emerald-700', red: 'bg-rose-100 text-rose-700' }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[12px] ${map[tone]}`}>{children}</span>
  )
}

export default function BoostedTasks() {
  const sb = getSupabase()
  const [state, setState] = useState<any[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const claimedCount = useMemo(() => state.filter((r) => r.state === 'claimed').length, [state])

  async function refresh() {
    setErr(null)
    // ENV yoksa kırılma yerine kart içinde uyarı göster
    if (!sb) {
      setErr('Supabase yapılandırılmadı. Yönetici: ENV değişkenlerini ekleyin.')
      setState([])
      return
    }
    try {
      const { user } = await getUserSafe()
      if (!user) {
        setErr('Oturum açmadın. Lütfen giriş yap.')
        setState([])
        return
      }

      // Görev kayıtları
      const { data: recs } = await sb.from('user_task_rewards').select('*').eq('user_id', user.id)
      const map = new Map(recs?.map((r: any) => [r.task_key, r]) || [])

      // Deposit tamamlama tespiti: cüzdan + investment_orders BUY toplamı ≥ 5000
      // (wallet check)
      const { data: pf } = await sb.from('profiles').select('wallet_address,nop_points').eq('id', user.id).single()
      const { data: orders } = await sb.from('investment_orders').select('amount_nop').eq('user_id', user.id).eq('type', 'buy')
      const sum = (orders || []).reduce((a: any, r: any) => a + Number(r.amount_nop || 0), 0)
      const depositReady = !!pf?.wallet_address && sum >= 5000

      // signup/contribute otomatik tespit
      const { data: posts } = await sb.from('posts').select('id').eq('author_id', user.id).limit(1)
      const contributeReady = (posts?.length || 0) > 0

      const merged = TASKS.map((t) => {
        const rec: any = map.get(t.key)
        if (t.key === 'signup') {
          if (rec?.claimed_at) return { ...t, state: 'claimed' }
          if (rec?.completed_at || user) return { ...t, state: 'ready' }
          return { ...t, state: 'locked' }
        }
        if (t.key === 'deposit') {
          if (rec?.claimed_at) return { ...t, state: 'claimed' }
          if (depositReady) return { ...t, state: 'ready' }
          return { ...t, state: 'locked' }
        }
        if (t.key === 'contribute') {
          if (rec?.claimed_at) return { ...t, state: 'claimed' }
          if (contributeReady) return { ...t, state: 'ready' }
          return { ...t, state: 'locked' }
        }
        return t
      })
      setState(merged)
    } catch (e: any) {
      setErr(e?.message || 'Görevler yüklenemedi.')
      setState([])
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function claim(task: 'signup' | 'deposit' | 'contribute') {
    if (!sb) return
    setBusy(task)
    try {
      const { user } = await getUserSafe()
      if (!user) throw new Error('Giriş yapmalısın.')
      const rec = state.find((r) => r.key === task)
      if (rec?.state !== 'ready') throw new Error('Şartlar henüz sağlanmadı.')
      // Güncel puanı al
      const { data: cur } = await sb.from('profiles').select('nop_points').eq('id', user.id).single()
      const next = Number(cur?.nop_points || 0) + Number(rec?.reward || 0)
      await sb.from('profiles').update({ nop_points: next }).eq('id', user.id)
      await sb
        .from('user_task_rewards')
        .upsert(
          {
            user_id: user.id,
            task_key: task,
            reward_nop: rec.reward,
            completed_at: new Date().toISOString(),
            claimed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,task_key' },
        )
      await refresh()
    } catch (e: any) {
      setErr(e?.message || 'Claim başarısız.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="p-4 rounded-2xl border" style={{ background: '#FFFFFF', boxShadow: '0 8px 24px rgba(79,70,229,.08)' }}>
      <div className="flex items-center justify-between">
        <div className="font-semibold text-[#0F172A]">Boosted Tasks</div>
        <div className="text-xs text-[#475569]">{claimedCount}/3 claimed</div>
      </div>
      {err && <div className="mt-2 text-[13px] text-rose-600">{err}</div>}
      <div className="mt-3 space-y-2">
        {state.length === 0 && !err && <div className="text-xs text-[#475569]">Görevler yükleniyor…</div>}
        {state.map((r) => (
          <div key={r.key} className="flex items-center justify-between p-3 rounded-xl border bg-white/70">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 grid place-items-center rounded-lg bg-[#F5F8FF] border">{r.icon}</div>
              <div>
                <div className="font-medium text-[#0F172A]">{r.title}</div>
                <div className="text-xs text-[#475569]">{r.desc}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <GoldChip>+{r.reward.toLocaleString()} NOP</GoldChip>
              {r.state === 'locked' && <Pill>Complete to unlock</Pill>}
              {r.state === 'ready' && (
                <button disabled={busy === r.key} onClick={() => claim(r.key)} className="px-3 py-1.5 rounded-lg border hover:shadow-sm">
                  {busy === r.key ? 'Claiming…' : 'Claim'}
                </button>
              )}
              {r.state === 'claimed' && <Pill tone="green">Claimed ✓</Pill>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
