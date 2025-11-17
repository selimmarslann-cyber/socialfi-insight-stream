'use client';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchTopUsers, shortId, type Period, type LeaderboardRow } from '@/lib/leaderboard';
import { cn } from '@/lib/utils';
import { DashboardCard } from '@/components/layout/visuals/DashboardCard';
import { DashboardSectionTitle } from '@/components/layout/visuals/DashboardSectionTitle';

function GoldChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 shadow-sm">
      {children}
    </span>
  );
}

function Rank({ index }: { index: number }) {
  const medalStyles = [
    'bg-gradient-to-br from-amber-400 to-amber-500 text-white',
    'bg-gradient-to-br from-slate-300 to-slate-500 text-white',
    'bg-gradient-to-br from-amber-600 to-amber-700 text-white',
  ];
  const baseClass =
    index < 3
      ? medalStyles[index]
      : 'border border-slate-200 bg-white text-slate-500';

  return (
    <div className={cn('grid h-8 w-8 place-items-center rounded-full text-xs font-semibold shadow-sm', baseClass)}>
      {index < 3 ? index + 1 : `#${index + 1}`}
    </div>
  );
}

function Avatar({ name, id }: { name?: string | null; id: string }) {
  const init =
    (name || '')
      .trim()
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || id.slice(0, 2).toUpperCase();

  return (
    <div className="grid h-9 w-9 place-items-center rounded-full border border-slate-100 bg-slate-100 font-semibold text-slate-700">
      {init}
    </div>
  );
}

type TopUsersCardProps = {
  title?: string;
  period?: Period;
  limit?: number;
  className?: string;
};

export default function TopUsersCard({
  title = 'Top Users',
  period = 'weekly',
  limit = 5,
  className,
}: TopUsersCardProps) {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [tab, setTab] = useState<Period>(period);
  const col = useMemo(() => (tab === 'daily' ? 'daily_score' : tab === 'weekly' ? 'weekly_score' : 'total_score'), [tab]);

  useEffect(() => {
    (async () => {
      setRows(null);
      const data = await fetchTopUsers(tab, limit);
      setRows(data);
    })();
  }, [tab, limit]);

  const tabs: { label: string; value: Period }[] = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'All-time', value: 'total' },
  ];

  return (
    <DashboardCard className={cn("flex h-full flex-col gap-4", className)}>
      <div className="flex flex-col gap-2">
        <DashboardSectionTitle label="Social Intelligence" title={title} />
        <div className="inline-flex rounded-full border border-slate-200/70 bg-slate-50 p-1 text-[11px] font-semibold text-slate-500">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={cn(
                "min-w-[70px] rounded-full px-3 py-1 transition",
                tab === item.value ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col divide-y divide-slate-100">
        {rows === null
          ? Array.from({ length: limit }).map((_, index) => (
              <div key={index} className="px-1 py-2.5">
                <div className="h-12 rounded-2xl bg-slate-50" />
              </div>
            ))
          : null}

        {Array.isArray(rows) && rows.length > 0
          ? rows.map((row, index) => (
              <div key={row.user_id} className="flex items-center justify-between px-1 py-2.5">
                <div className="flex items-center gap-3">
                  <Rank index={index} />
                  <Avatar name={row.profiles?.username || null} id={row.user_id} />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-900">@{row.profiles?.username || shortId(row.user_id)}</span>
                    <span className="text-[11px] text-slate-500">NOPmock+</span>
                  </div>
                </div>
                <GoldChip>{(row[col] || 0).toLocaleString()} pts</GoldChip>
              </div>
            ))
          : null}

        {Array.isArray(rows) && rows.length === 0 ? (
          <div className="px-1 py-4 text-sm text-slate-500">No users yet.</div>
        ) : null}
      </div>
    </DashboardCard>
  );
}
