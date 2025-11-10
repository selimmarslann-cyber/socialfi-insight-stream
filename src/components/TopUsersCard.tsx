'use client'
import { useEffect, useMemo, useState } from 'react'
import { fetchTopUsers, formatIdShort, type Period, type TopRow } from '@/lib/leaderboard'

function GoldChip({ children }: { children: any }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[12px] bg-[#F5C76A] text-[#0F172A] font-semibold shadow-sm">
      {children}
    </span>
  )
}
function RankBadge({ i }: { i: number }) {
  const map = ['🥇', '🥈', '🥉']
  return <div className="w-7 h-7 grid place-items-center rounded-full border bg-white text-[15px] shadow-sm">{map[i] || `#${i + 1}`}</div>
}
function InitialAvatar({ name, id }: { name?: string | null; id: string }) {
  const initials = (name || '')
    .trim()
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || id.slice(0, 2).toUpperCase()
  return (
    <div
      className="w-8 h-8 rounded-full grid place-items-center font-semibold"
      style={{ background: '#F5F8FF', border: '1px solid rgba(79,70,229,.15)' }}
    >
      {initials}
    </div>
  )
}
function SkeletonRow() {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg border bg-white/70 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-slate-100" />
        <div className="w-8 h-8 rounded-full bg-slate-100" />
        <div className="w-24 h-3 rounded bg-slate-100" />
      </div>
      <div className="w-14 h-5 rounded bg-slate-100" />
    </div>
  )
}

export default function TopUsersCard({
  title = 'Top Users',
  period = 'weekly',
  limit = 5
}: {
  title?: string
  period?: Period
  limit?: number
}) {
  const [rows, setRows] = useState<TopRow[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [tab, setTab] = useState<Period>(period as Period)

  const scoreKey = useMemo(() => (tab === 'daily' ? 'daily_score' : tab === 'weekly' ? 'weekly_score' : 'total_score'), [tab])

  useEffect(() => {
    ;(async () => {
      setErr(null)
      setRows(null)
      try {
        const data = await fetchTopUsers(tab, limit)
        setRows(data)
      } catch (e: any) {
        setErr(e?.message || 'Error')
        setRows([])
      }
    })()
  }, [tab, limit])

  return (
    <div
      className="relative rounded-2xl border p-3"
      style={{ background: '#FFFFFF', boxShadow: '0 8px 24px rgba(79,70,229,.08)' }}
    >
      {/* Gradient köşe dekor */}
      <div
        className="absolute -top-2 -right-2 w-16 h-16 rounded-full blur-xl opacity-40 pointer-events-none"
        style={{ background: 'linear-gradient(120deg,#4F46E5,#06B6D4)' }}
      />
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-[#0F172A]">{title}</div>
        <div className="flex items-center gap-2 text-[12px] text-[#475569]">
          <button
            onClick={() => setTab('daily')}
            className={`px-2 py-0.5 rounded ${tab === 'daily' ? 'bg-indigo-50 text-indigo-700' : ''}`}
          >
            Daily
          </button>
          <button
            onClick={() => setTab('weekly')}
            className={`px-2 py-0.5 rounded ${tab === 'weekly' ? 'bg-indigo-50 text-indigo-700' : ''}`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTab('total')}
            className={`px-2 py-0.5 rounded ${tab === 'total' ? 'bg-indigo-50 text-indigo-700' : ''}`}
          >
            All-time
          </button>
        </div>
      </div>

      {err && <div className="text-rose-600 text-[13px] mb-2">{err}</div>}

      <div className="space-y-2">
        {rows === null && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}
        {Array.isArray(rows) &&
          rows.map((r, i) => (
            <div key={r.user_id} className="flex items-center justify-between p-2.5 rounded-lg border bg-white/70">
              <div className="flex items-center gap-3">
                <RankBadge i={i} />
                <InitialAvatar name={r.profiles?.username || null} id={r.user_id} />
                <div className="flex flex-col">
                  <div className="font-medium text-[#0F172A] leading-tight">
                    @{r.profiles?.username || formatIdShort(r.user_id)}
                  </div>
                  <div className="text-[12px] text-[#475569] leading-tight opacity-80">NOP{r.user_id.slice(0, 5)}</div>
                </div>
              </div>
              <GoldChip>{(r as any)[scoreKey] ?? 0} pts</GoldChip>
            </div>
          ))}
        {Array.isArray(rows) && rows.length === 0 && <div className="text-[13px] text-[#475569]">No users yet.</div>}
      </div>
    </div>
  )
}
