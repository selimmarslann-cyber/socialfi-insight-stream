import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";
import { getPoolAnalyticsForContribute } from "@/lib/poolAnalytics";
import { getActiveChain } from "@/config/chains";
import { formatUnits } from "ethers";

type PoolAnalyticsCardProps = {
  contributeId: string;
  poolAddress: string;
};

export function PoolAnalyticsCard({ contributeId, poolAddress }: PoolAnalyticsCardProps) {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ["pool-analytics", contributeId],
    queryFn: () => getPoolAnalyticsForContribute(contributeId),
    staleTime: 60 * 1000, // 1 minute
  });

  const chain = getActiveChain();

  if (isLoading) {
    return (
      <Card className="rounded-3xl border border-border bg-card p-6 shadow-card-soft">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Pool Analytics</h2>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </Card>
    );
  }

  if (error || !analytics) {
    return null;
  }

  return (
    <Card className="rounded-3xl border border-border bg-card p-6 shadow-card-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Pool Analytics</h2>
        <a
          href={`${chain.explorerUrl}/address/${poolAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600"
        >
          View on Explorer
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Participants</p>
          <p className="text-2xl font-semibold text-text-primary">{analytics.uniqueWallets}</p>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Total Positions</p>
          <p className="text-2xl font-semibold text-text-primary">{analytics.totalPositions}</p>
        </div>

        {analytics.buySellRatio !== undefined && (
          <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Buy/Sell Ratio</p>
            <p className="text-2xl font-semibold text-text-primary">
              {analytics.buySellRatio.toFixed(2)}:1
            </p>
          </div>
        )}

        {analytics.avgPositionSize !== undefined && (
          <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Avg Position Size</p>
            <p className="text-2xl font-semibold text-text-primary">
              {formatUnits(BigInt(Math.round(analytics.avgPositionSize)), 18)}
            </p>
          </div>
        )}

        {analytics.last24hVolume !== undefined && (
          <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Last 24h Volume</p>
            <p className="text-2xl font-semibold text-text-primary">
              {formatUnits(BigInt(Math.round(analytics.last24hVolume)), 18)}
            </p>
          </div>
        )}

        {analytics.last7dVolume !== undefined && (
          <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Last 7d Volume</p>
            <p className="text-2xl font-semibold text-text-primary">
              {formatUnits(BigInt(Math.round(analytics.last7dVolume)), 18)}
            </p>
          </div>
        )}

        {analytics.uniqueDaysActive !== undefined && (
          <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Active Days</p>
            <p className="text-2xl font-semibold text-text-primary">{analytics.uniqueDaysActive}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

