'use client';
// NOTE: This card is currently parked outside the main 2025 dashboard layout; TrendingUsers powers the homepage list.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { shortId } from "@/lib/leaderboard";
import { fetchTopAlphaUsers, type AlphaUser } from "@/lib/reputation";
import { cn } from "@/lib/utils";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";

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
  title = "Top Operators",
  limit = 5,
  className,
}: TopUsersCardProps) {
  const [users, setUsers] = useState<AlphaUser[] | null>(null);

  useEffect(() => {
    let mounted = true;
    setUsers(null);
    (async () => {
      try {
        const data = await fetchTopAlphaUsers({ limit, withinDays: 7 });
        if (mounted) {
          setUsers(data);
        }
      } catch (error) {
        console.warn("[TopUsersCard] failed to fetch alpha users", error);
        if (mounted) {
          setUsers([]);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [limit]);

  const isLoading = users === null;
  const hasData = Array.isArray(users) && users.length > 0;

  const volumeFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [],
  );

  return (
    <DashboardCard className={cn("flex h-full flex-col gap-4", className)}>
      <div className="flex flex-col gap-1.5">
        <DashboardSectionTitle label="Protocol" title={title} />
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
          Ranked by Alpha Score (7d volume)
        </p>
      </div>

      <div className="flex flex-1 flex-col divide-y divide-slate-100">
        {isLoading
          ? Array.from({ length: limit }).map((_, index) => (
              <div key={`alpha-skeleton-${index}`} className="px-1 py-2.5">
                <div className="h-12 rounded-2xl bg-slate-50" />
              </div>
            ))
          : null}

        {hasData
          ? users!.map((user, index) => (
              <div
                key={`${user.walletAddress}-${index}`}
                className="flex items-center justify-between px-1 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <Rank index={index} />
                  <Avatar address={user.walletAddress} />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-900">
                      {shortId(user.walletAddress)}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {user.trades} trades • {volumeFormatter.format(user.volumeNop)} NOP
                    </span>
                  </div>
                </div>
                <GoldChip>
                  α {volumeFormatter.format(user.score)}
                </GoldChip>
              </div>
            ))
          : null}

        {Array.isArray(users) && users.length === 0 && !isLoading ? (
          <div className="px-1 py-4 text-sm text-slate-500">
            No on-chain activity yet. Trade a pool to appear here.
          </div>
        ) : null}
      </div>
    </DashboardCard>
  );
}
