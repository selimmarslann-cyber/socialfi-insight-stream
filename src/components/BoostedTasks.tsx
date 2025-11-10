'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/Card'
import { BOOST_TASKS, fetchTaskStates, ensureCompleted, claimTask } from '@/lib/tasks'
import type { TaskKey } from '@/lib/tasks'

type Row = { key: TaskKey; title: string; reward: number; state: 'locked' | 'ready' | 'claimed' }

export default function BoostedTasks() {
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState<TaskKey | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function refresh() {
    setErr(null)
    try {
      const base = BOOST_TASKS.map((t) => ({
        key: t.key,
        title: t.title,
        reward: t.reward,
        state: 'locked' as Row['state'],
      }))

      for (const t of BOOST_TASKS) {
        await ensureCompleted(t.key, t.reward)
      }

      const map = await fetchTaskStates()
      const merged = base.map((b) => {
        const rec = map.get(b.key)
        if (rec?.claimed_at) return { ...b, state: 'claimed' }
        if (rec?.completed_at && !rec?.claimed_at) return { ...b, state: 'ready' }
        return b
      })
      setRows(merged)
    } catch (e: any) {
      setErr(e?.message || 'Error')
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function doClaim(k: TaskKey) {
    setBusy(k)
    try {
      await claimTask(k)
      await refresh()
      window.alert('Ödül hesabına eklendi 🎉')
    } catch (e: any) {
      window.alert(e?.message || 'Claim başarısız')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card
      title="Boosted Tasks"
      right={<div className="text-xs opacity-60">{rows.filter((r) => r.state === 'claimed').length}/3 claimed</div>}
    >
      {err ? <div className="mb-2 text-sm text-rose-600">{err}</div> : null}
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between rounded-lg border bg-white/70 p-3">
            <div>
              <div className="font-medium">{r.title}</div>
              <div className="text-xs opacity-70">
                +{r.reward.toLocaleString('tr-TR')} NOP • Tek seferlik
              </div>
            </div>
            <div className="flex items-center gap-3">
              {r.state === 'locked' ? (
                <span className="rounded bg-gray-100 px-2 py-1 text-xs">Complete to unlock</span>
              ) : null}
              {r.state === 'ready' ? (
                <button
                  disabled={busy === r.key}
                  onClick={() => doClaim(r.key)}
                  className="rounded border px-3 py-1.5 text-sm"
                >
                  {busy === r.key ? 'Claiming…' : 'Claim'}
                </button>
              ) : null}
              {r.state === 'claimed' ? (
                <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-700">Claimed</span>
              ) : null}
            </div>
          </div>
        ))}
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-white/50 p-3 text-xs text-slate-500">
            Görevler yükleniyor...
          </div>
        ) : null}
      </div>
    </Card>
  )
}
