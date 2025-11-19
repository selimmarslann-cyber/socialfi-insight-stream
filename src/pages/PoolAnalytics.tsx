import { useQuery } from "@tanstack/react-query";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { supabase } from "@/lib/supabaseClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

type PoolAnalytics = {
  totalVolume: number;
  activePools: number;
  avgParticipation: number;
  topPoolsByVolume: Array<{
    postId: number;
    volume: number;
    participants: number;
  }>;
  topPoolsByPnL: Array<{
    postId: number;
    totalPnL: number;
    participants: number;
  }>;
};

const fetchPoolAnalytics = async (): Promise<PoolAnalytics> => {
  if (!supabase) {
    return {
      totalVolume: 0,
      activePools: 0,
      avgParticipation: 0,
      topPoolsByVolume: [],
      topPoolsByPnL: [],
    };
  }

  // Fetch active pools
  const { data: activePoolsData } = await supabase
    .from("social_posts")
    .select("id, contract_post_id")
    .eq("pool_enabled", true);

  const activePools = activePoolsData?.length ?? 0;
  const contractPostIds = (activePoolsData ?? [])
    .map((p) => p.contract_post_id)
    .filter((id): id is number => typeof id === "number");

  // Fetch trades
  const { data: trades } = await supabase
    .from("nop_trades")
    .select("post_id, amount_nop, side, executed_at");

  // Calculate total volume
  const totalVolume = (trades ?? []).reduce((sum, t) => sum + Number(t.amount_nop ?? 0), 0);

  // Calculate volume by pool
  const volumeByPool = new Map<number, { volume: number; participants: Set<string> }>();
  (trades ?? []).forEach((trade) => {
    const postId = Number(trade.post_id);
    if (!Number.isFinite(postId)) return;
    const amount = Number(trade.amount_nop ?? 0);
    const wallet = trade.wallet_address?.toLowerCase() ?? "";

    if (!volumeByPool.has(postId)) {
      volumeByPool.set(postId, { volume: 0, participants: new Set() });
    }
    const stats = volumeByPool.get(postId)!;
    stats.volume += amount;
    if (wallet) stats.participants.add(wallet);
  });

  // Top pools by volume
  const topPoolsByVolume = Array.from(volumeByPool.entries())
    .map(([postId, stats]) => ({
      postId,
      volume: stats.volume,
      participants: stats.participants.size,
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  // Calculate PnL from social_positions
  const { data: positions } = await supabase
    .from("social_positions")
    .select("contribute_id, realized_pnl_usd, user_address");

  const pnlByPool = new Map<number, { totalPnL: number; participants: Set<string> }>();
  (positions ?? []).forEach((pos) => {
    // Map contribute_id to contract_post_id if possible
    // For now, we'll use a simplified approach
    const pnl = Number(pos.realized_pnl_usd ?? 0);
    const wallet = pos.user_address?.toLowerCase() ?? "";
    // TODO: Map contribute_id to contract_post_id properly
    // For now, we'll aggregate by contribute_id
    const poolKey = pos.contribute_id ? Number(pos.contribute_id) : 0;
    if (poolKey > 0) {
      if (!pnlByPool.has(poolKey)) {
        pnlByPool.set(poolKey, { totalPnL: 0, participants: new Set() });
      }
      const stats = pnlByPool.get(poolKey)!;
      stats.totalPnL += pnl;
      if (wallet) stats.participants.add(wallet);
    }
  });

  const topPoolsByPnL = Array.from(pnlByPool.entries())
    .map(([postId, stats]) => ({
      postId,
      totalPnL: stats.totalPnL,
      participants: stats.participants.size,
    }))
    .sort((a, b) => b.totalPnL - a.totalPnL)
    .slice(0, 5);

  // Calculate average participation
  const allParticipants = new Set<string>();
  volumeByPool.forEach((stats) => {
    stats.participants.forEach((p) => allParticipants.add(p));
  });
  const avgParticipation = activePools > 0 ? allParticipants.size / activePools : 0;

  return {
    totalVolume,
    activePools,
    avgParticipation: Math.round(avgParticipation * 10) / 10,
    topPoolsByVolume,
    topPoolsByPnL,
  };
};

const StatCard = ({ label, value, icon: Icon }: { label: string; value: string | number; icon?: React.ComponentType<{ className?: string }> }) => (
  <Card className="rounded-2xl border border-border bg-card p-4 shadow-subtle">
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</p>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-indigo-400" />}
        <p className="text-2xl font-semibold text-text-primary">{value}</p>
      </div>
    </div>
  </Card>
);

export default function PoolAnalytics() {
  usePageMetadata({
    title: "Pool Analytics — NOP Intelligence Layer",
    description: "Comprehensive analytics dashboard for all trading pools.",
  });

  const analyticsQuery = useQuery({
    queryKey: ["pool-analytics"],
    queryFn: fetchPoolAnalytics,
    staleTime: 60_000,
  });

  const analytics = analyticsQuery.data;

  return (
    <div className="space-y-6">
      <DashboardCard className="space-y-3">
        <DashboardSectionTitle label="Analytics" title="Pool Analytics Dashboard" />
        <p className="text-sm text-text-secondary">
          Real-time metrics and insights for all active trading pools on the NOP Intelligence Layer.
        </p>
      </DashboardCard>

      {analyticsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : analytics ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Volume"
              value={`${(analytics.totalVolume / 1000).toFixed(1)}K NOP`}
            />
            <StatCard
              label="Active Pools"
              value={analytics.activePools}
            />
            <StatCard
              label="Avg Participation"
              value={`${analytics.avgParticipation.toFixed(1)} users`}
            />
            <StatCard
              label="Total Positions"
              value={analytics.topPoolsByVolume.reduce((sum, p) => sum + p.participants, 0)}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <DashboardCard className="space-y-3">
              <DashboardSectionTitle label="Volume Leaders" title="Top 5 Pools by Volume" />
              {analytics.topPoolsByVolume.length > 0 ? (
                <div className="space-y-2">
                  {analytics.topPoolsByVolume.map((pool, index) => (
                    <div
                      key={pool.postId}
                      className="flex items-center justify-between rounded-2xl border border-border-subtle bg-card/70 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Pool #{pool.postId}</p>
                        <p className="text-xs text-text-muted">{pool.participants} participants</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-text-primary">
                          {(pool.volume / 1000).toFixed(1)}K NOP
                        </p>
                        <p className="text-xs text-text-muted">#{index + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted">No volume data yet.</p>
              )}
            </DashboardCard>

            <DashboardCard className="space-y-3">
              <DashboardSectionTitle label="Performance Leaders" title="Top 5 Pools by Realized PnL" />
              {analytics.topPoolsByPnL.length > 0 ? (
                <div className="space-y-2">
                  {analytics.topPoolsByPnL.map((pool, index) => (
                    <div
                      key={pool.postId}
                      className="flex items-center justify-between rounded-2xl border border-border-subtle bg-card/70 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Pool #{pool.postId}</p>
                        <p className="text-xs text-text-muted">{pool.participants} participants</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-semibold ${
                            pool.totalPnL >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {pool.totalPnL >= 0 ? "+" : ""}
                          {pool.totalPnL.toFixed(2)} USD
                        </p>
                        <p className="text-xs text-text-muted">#{index + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted">No PnL data yet.</p>
              )}
            </DashboardCard>
          </div>
        </>
      ) : (
        <p className="text-sm text-text-muted">Failed to load analytics.</p>
      )}
    </div>
  );
}

