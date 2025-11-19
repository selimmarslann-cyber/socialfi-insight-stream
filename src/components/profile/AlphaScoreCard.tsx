import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAlphaMetrics, getAlphaLabel, type AlphaMetrics } from "@/lib/alpha";
import { cn } from "@/lib/utils";

type AlphaScoreCardProps = {
  walletAddress: string;
  className?: string;
};

export function AlphaScoreCard({ walletAddress, className }: AlphaScoreCardProps) {
  const alphaQuery = useQuery({
    queryKey: ["alpha-metrics", walletAddress],
    queryFn: () => getAlphaMetrics(walletAddress),
    enabled: Boolean(walletAddress),
  });

  const metrics = alphaQuery.data;

  if (alphaQuery.isLoading) {
    return (
      <Card className={cn("rounded-3xl border border-border bg-card p-6 shadow-card-soft", className)}>
        <Skeleton className="h-32 w-full rounded-2xl" />
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className={cn("rounded-3xl border border-border bg-card p-6 shadow-card-soft", className)}>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Alpha Score</p>
          <p className="text-sm text-text-secondary">No on-chain positions yet.</p>
        </div>
      </Card>
    );
  }

  const label = getAlphaLabel(metrics.alpha_score);
  const winRate = metrics.closed_positions > 0
    ? ((metrics.wins / metrics.closed_positions) * 100).toFixed(0)
    : "—";

  // Color scheme based on label
  const labelColors = {
    Rookie: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    Intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Pro: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    Elite: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  };

  return (
    <Card className={cn("rounded-3xl border border-border bg-card p-6 shadow-card-soft", className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Alpha Score</p>
          <Badge className={cn("rounded-full font-semibold", labelColors[label])}>
            {label}
          </Badge>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-text-primary">{Math.round(metrics.alpha_score)}</span>
          <span className="text-sm text-text-secondary">/ 100</span>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div>
            <p className="text-xs text-text-muted">Positions</p>
            <p className="text-lg font-semibold text-text-primary">{metrics.total_positions}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Win Rate</p>
            <p className="text-lg font-semibold text-text-primary">{winRate}%</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Best ROI</p>
            <p className="text-lg font-semibold text-text-primary">
              {metrics.best_roi !== null ? `+${metrics.best_roi.toFixed(1)}%` : "—"}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

