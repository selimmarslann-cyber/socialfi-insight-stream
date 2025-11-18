'use client';
// NOTE: This card is currently parked outside the main 2025 dashboard layout; TrendingUsers powers the homepage list.
import { useEffect, useState, type ReactNode } from 'react';
import { fetchTopUsers, shortId, type ReputationLeaderboardRow } from '@/lib/leaderboard';
import { cn } from '@/lib/utils';
import { DashboardCard } from '@/components/layout/visuals/DashboardCard';
import { DashboardSectionTitle } from '@/components/layout/visuals/DashboardSectionTitle';

function GoldChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 shadow-sm">
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

function Avatar({ address }: { address: string }) {
  const init = address.slice(2, 4).toUpperCase();
  return (
    <div className="grid h-9 w-9 place-items-center rounded-full border border-slate-100 bg-slate-100 font-semibold text-slate-700">
      {init}
    </div>
  );
}

type TopUsersCardProps = {
  title?: string;
  limit?: number;
  className?: string;
};

export default function TopUsersCard({
  title = 'Top Operators',
  limit = 5,
  className,
}: TopUsersCardProps) {
  const [rows, setRows] = useState<ReputationLeaderboardRow[] | null>(null);

  useEffect(() => {
    (async () => {
      setRows(null);
      const data = await fetchTopUsers(limit);
      setRows(data);
    })();
  }, [limit]);

  return (
    <DashboardCard className={cn("flex h-full flex-col gap-4", className)}>
      <div className="flex flex-col gap-1.5">
        <DashboardSectionTitle label="Protocol" title={title} />
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
          Ranked by realized PnL & win rate
        </p>
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
              <div key={row.user_address} className="flex items-center justify-between px-1 py-2.5">
                <div className="flex items-center gap-3">
                  <Rank index={index} />
                  <Avatar address={row.user_address} />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-900">{shortId(row.user_address)}</span>
                    <span className="text-[11px] text-slate-500">
                      Win rate {(row.win_rate ?? 0).toFixed(1)}% • {row.total_positions} trades
                    </span>
                  </div>
                </div>
                <GoldChip>{row.realized_pnl_usd >= 0 ? `+${row.realized_pnl_usd.toFixed(0)}$` : `${row.realized_pnl_usd.toFixed(0)}$`}</GoldChip>
              </div>
            ))
          : null}

        {Array.isArray(rows) && rows.length === 0 ? (
          <div className="px-1 py-4 text-sm text-slate-500">No operators yet.</div>
        ) : null}
      </div>
    </DashboardCard>
  );
}
