import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { StatusPill } from "@/components/ui/status-pill";
import { fetchTopAlphaUsers, type AlphaUser } from "@/lib/reputation";
import { shortId } from "@/lib/leaderboard";

interface TrendingUsersProps {
  limit?: number;
}

  const trendIcon = (netVolume?: number) => {
    if ((netVolume ?? 0) > 0) {
      return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
    }
    if ((netVolume ?? 0) < 0) {
      return <TrendingDown className="h-3.5 w-3.5 text-rose-500" />;
    }
    return <Minus className="h-3.5 w-3.5 text-slate-400" />;
  };

  export const TrendingUsers = ({ limit = 5 }: TrendingUsersProps) => {
    const { data, isLoading } = useQuery({
      queryKey: ["alphaTrendingUsers", limit],
      queryFn: () => fetchTopAlphaUsers({ limit, withinDays: 3 }),
      staleTime: 60_000,
    });

    const volumeFormatter = useMemo(
      () =>
        new Intl.NumberFormat(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }),
      [],
    );

    const displayUsers: AlphaUser[] = data ?? [];

  return (
    <DashboardCard>
      <DashboardSectionTitle label="Social Intelligence" title="Trending Users" />
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: limit }).map((_, index) => (
              <div key={`trending-skeleton-${index}`} className="flex items-center justify-between gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-2/3 rounded-full" />
                  <Skeleton className="h-3 w-1/3 rounded-full" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))
            : displayUsers.map((user, index) => (
                <div
                    key={user.walletAddress}
                  className="flex items-center justify-between gap-3 rounded-[16px] border border-border-subtle bg-surface px-3 py-2"
                >
                <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border-subtle bg-surface text-text-primary">
                      <AvatarFallback className="text-xs font-semibold">
                        {user.walletAddress.slice(2, 4).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                        <p className="truncate text-sm-2 font-semibold text-text-primary">
                          {shortId(user.walletAddress)}
                        </p>
                        <p className="text-xs-2 text-text-secondary">
                          {volumeFormatter.format(user.volumeNop)} NOP • {user.trades} trades
                        </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <StatusPill tone="muted" className="text-[11px]">
                        #{index + 1}
                    </StatusPill>
                    <StatusPill className="bg-surface text-text-primary ring-1 ring-border-subtle/50">
                        {trendIcon(user.netVolumeNop)}
                        α {volumeFormatter.format(user.score)}
                    </StatusPill>
                </div>
              </div>
            ))}

            {!isLoading && displayUsers.length === 0 ? (
              <p className="text-xs-2 text-text-muted">No on-chain trades yet. Execute a pool trade to appear here.</p>
            ) : null}
      </div>
    </DashboardCard>
  );
};
