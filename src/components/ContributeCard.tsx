import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUnits } from "ethers";
import { formatDistanceToNow } from "date-fns";
import type { Contribute } from "@/lib/types";
import { TradeActions } from "@/components/pool/TradeActions";
import { getUserPosition } from "@/lib/pool";
import { getPoolAnalyticsForContribute } from "@/lib/poolAnalytics";
import { ShareButton } from "@/components/share/ShareButton";
import { cn } from "@/lib/utils";

type ContributeCardProps = {
  item: Contribute;
};

function ContributeCard({ item }: ContributeCardProps) {
  const [positionWei, setPositionWei] = useState<bigint>(0n);
  const [isSyncingPosition, setIsSyncingPosition] = useState(false);
  const contractPostId = typeof item.contractPostId === "number" ? item.contractPostId : null;
  const isPoolActive = item.poolEnabled === true && contractPostId !== null;
  const weeklyVolume =
    typeof item.weeklyVolumeNop === "number" ? item.weeklyVolumeNop : null;

  const refreshPosition = useCallback(async () => {
    if (!isPoolActive || contractPostId === null) return;
    if (typeof window === "undefined" || !window.ethereum) return;

    try {
      setIsSyncingPosition(true);
      const accounts = (await window.ethereum.request({
        method: "eth_accounts",
      })) as string[];
      const address = accounts?.[0];
      if (!address) return;
      const result = await getUserPosition(contractPostId, address);
      setPositionWei(result?.shares ?? 0n);
    } catch (error) {
      console.error("[ContributeCard] Failed to fetch position", error);
    } finally {
      setIsSyncingPosition(false);
    }
  }, [contractPostId, isPoolActive]);

  useEffect(() => {
    void refreshPosition();
  }, [refreshPosition]);

  const formattedPosition = useMemo(
    () => formatUnits(positionWei ?? 0n, 18),
    [positionWei],
  );
  const volumeFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [],
  );
  const formattedWeeklyVolume =
    weeklyVolume === null ? null : volumeFormatter.format(weeklyVolume);

    return (
      <Card className="group space-y-4 rounded-2xl border-2 border-border-subtle bg-card p-4 shadow-lg transition-all duration-300 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/20 dark:hover:border-cyan-600 dark:hover:shadow-cyan-500/20 sm:space-y-5 sm:p-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-4">
        <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Weekly popular pool
          </p>
            <h3 className="text-xl font-semibold text-foreground transition-colors duration-200 group-hover:text-indigo-600 dark:group-hover:text-cyan-400">
              {item.title}
            </h3>
          {item.subtitle ? (
              <p className="text-sm text-muted-foreground">{item.subtitle}</p>
          ) : null}
          {item.author ? (
              <p className="text-xs font-semibold text-muted-foreground">by {item.author}</p>
          ) : null}
        </div>
          <div className="flex items-center gap-4">
            {formattedWeeklyVolume ? (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">7d volume</p>
                  <p className="text-2xl font-semibold text-foreground">
                  {formattedWeeklyVolume}
                    <span className="ml-1 text-sm font-medium text-muted-foreground">NOP</span>
                </p>
              </div>
            ) : typeof item.weeklyScore === "number" ? (
              <div className="text-right">
                  <p className="text-xs text-muted-foreground">Weekly score</p>
                  <p className="text-2xl font-semibold text-foreground">
                  {item.weeklyScore}
                </p>
              </div>
            ) : null}
          <Badge
            variant={isPoolActive ? "secondary" : "outline"}
            className={cn(
              "transition-all duration-200",
              isPoolActive
                ? "bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-surface-muted text-text-muted"
            )}
          >
            {isPoolActive ? "Active" : "Locked"}
          </Badge>
        </div>
      </div>

        {item.tags?.length ? (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-700 transition-all duration-200 hover:bg-indigo-100 hover:scale-105 dark:bg-cyan-950/40 dark:text-cyan-300 dark:hover:bg-cyan-950/60"
            >
              {tag.startsWith("#") ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      ) : null}

      {item.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
          {item.description}
        </p>
      ) : null}

      {isPoolActive ? (
        <PoolStatsCard contributeId={item.id} />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {isPoolActive ? (
          <div className="flex-1">
            <TradeActions
              contractPostId={contractPostId}
              onSettled={refreshPosition}
              className="bg-muted/50"
            />
          </div>
        ) : (
          <div className="flex-1 rounded-xl border-2 border-dashed border-border-subtle bg-surface-muted p-3 text-sm text-text-secondary sm:p-4">
            Pool will open soon. Follow this contribution for launch updates.
          </div>
        )}
        
        <div className="flex items-center gap-2 sm:flex-shrink-0">
          <ShareButton
            contributeId={item.id}
            contributeTitle={item.title}
            postId={contractPostId || undefined}
          />
        </div>
      </div>

        <p className="text-xs text-muted-foreground">
        Your on-chain position:{" "}
          <span className="font-semibold text-foreground">{formattedPosition} NOP</span>
        {isSyncingPosition ? " · Syncing…" : null}
      </p>
    </Card>
  );
}

function PoolStatsCard({ contributeId }: { contributeId: string }) {
  const analyticsQuery = useQuery({
    queryKey: ["pool-analytics", contributeId],
    queryFn: () => getPoolAnalyticsForContribute(contributeId),
    enabled: Boolean(contributeId),
    staleTime: 60_000,
  });

  const analytics = analyticsQuery.data;

  if (!analytics) {
    return null;
  }

  return (
    <div className="rounded-xl border-2 border-border-subtle bg-surface-muted/50 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Pool Stats</p>
      {analyticsQuery.isLoading ? (
        <Skeleton className="h-20 w-full rounded-xl" />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-text-muted">Participants</p>
            <p className="text-lg font-semibold text-text-primary">{analytics.uniqueWallets}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Positions</p>
            <p className="text-lg font-semibold text-text-primary">{analytics.totalPositions}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Last Activity</p>
            <p className="text-sm font-semibold text-text-primary">
              {analytics.lastActivityAt
                ? formatDistanceToNow(new Date(analytics.lastActivityAt), { addSuffix: true })
                : "—"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContributeCard;
export { ContributeCard };
