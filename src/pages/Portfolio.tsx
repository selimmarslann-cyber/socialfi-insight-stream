import { useQuery } from "@tanstack/react-query";
import { useWalletStore } from "@/lib/store";
import { fetchUserPortfolio, calculatePortfolioSummary, formatPortfolioValue, type PortfolioPosition } from "@/lib/portfolio";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatTokenAmount } from "@/lib/format";
import { TrendingUp, TrendingDown, Wallet, BarChart3, Trophy, AlertCircle } from "lucide-react";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Portfolio() {
  const { address, connected } = useWalletStore();

  usePageMetadata({
    title: "Portfolio — NOP Intelligence Layer",
    description: "View your complete portfolio, positions, and performance metrics",
  });

  const portfolioQuery = useQuery({
    queryKey: ["portfolio", address],
    queryFn: () => fetchUserPortfolio(address ?? ""),
    enabled: Boolean(address && connected),
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  const summaryQuery = useQuery({
    queryKey: ["portfolio-summary", address],
    queryFn: () => calculatePortfolioSummary(address ?? ""),
    enabled: Boolean(address && connected),
    refetchInterval: 30 * 1000,
  });

  const positions = portfolioQuery.data ?? [];
  const summary = summaryQuery.data;

  if (!connected || !address) {
    return (
      <EmptyState
        title="Connect Your Wallet"
        description="Connect your wallet to view your portfolio"
        icon={Wallet}
      />
    );
  }

  if (portfolioQuery.isLoading || summaryQuery.isLoading) {
    return <LoadingState message="Loading portfolio..." />;
  }

  return (
    <Tabs defaultValue="portfolio" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/40 p-1">
        <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="portfolio" className="space-y-6">
        {/* Portfolio Summary */}
        <DashboardCard className="space-y-4">
        <DashboardSectionTitle label="Overview" title="Portfolio Summary" />
        
        {summary ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-xl border border-border-subtle bg-surface p-3 sm:rounded-2xl sm:p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted sm:text-xs">Total Value</p>
              <p className="mt-1.5 text-xl font-semibold text-text-primary sm:mt-2 sm:text-2xl">
                {formatPortfolioValue(summary.totalValue)}
              </p>
              <p className="mt-1 text-[10px] text-text-secondary sm:text-xs">
                Invested: {formatPortfolioValue(summary.totalInvested)}
              </p>
            </Card>

            <Card className="rounded-xl border border-border-subtle bg-surface p-3 sm:rounded-2xl sm:p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted sm:text-xs">Total PnL</p>
              <div className="mt-2 flex items-center gap-2">
                {summary.totalPnLPercent >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
                <p className={`text-xl font-semibold sm:text-2xl ${
                  summary.totalPnLPercent >= 0 ? "text-emerald-500" : "text-red-500"
                }`}>
                  {summary.totalPnLPercent >= 0 ? "+" : ""}
                  {summary.totalPnLPercent.toFixed(2)}%
                </p>
              </div>
              <p className="mt-1 text-[10px] text-text-secondary sm:text-xs">
                {formatPortfolioValue(summary.totalPnL)}
              </p>
            </Card>

            <Card className="rounded-xl border border-border-subtle bg-surface p-3 sm:rounded-2xl sm:p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted sm:text-xs">Open Positions</p>
              <p className="mt-1.5 text-xl font-semibold text-text-primary sm:mt-2 sm:text-2xl">
                {summary.openPositions}
              </p>
              <p className="mt-1 text-[10px] text-text-secondary sm:text-xs">
                of {summary.totalPositions} total
              </p>
            </Card>

            <Card className="rounded-xl border border-border-subtle bg-surface p-3 sm:rounded-2xl sm:p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted sm:text-xs">Win Rate</p>
              <p className="mt-1.5 text-xl font-semibold text-text-primary sm:mt-2 sm:text-2xl">
                {summary.winRate.toFixed(1)}%
              </p>
              <p className="mt-1 text-[10px] text-text-secondary sm:text-xs">
                {positions.filter(p => p.unrealizedPnL > 0n).length} winning
              </p>
            </Card>
          </div>
        ) : null}

        {/* Best & Worst Positions */}
        {summary && (summary.bestPosition || summary.worstPosition) && (
          <div className="grid gap-4 md:grid-cols-2">
            {summary.bestPosition && (
              <Card className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Best Position</p>
                </div>
                <p className="mt-2 text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                  {summary.bestPosition.contributeTitle}
                </p>
                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                  +{summary.bestPosition.unrealizedPnLPercent.toFixed(2)}% (
                  {formatPortfolioValue(summary.bestPosition.unrealizedPnL)})
                </p>
              </Card>
            )}

            {summary.worstPosition && (
              <Card className="rounded-2xl border border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-950/20">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100">Worst Position</p>
                </div>
                <p className="mt-2 text-lg font-semibold text-red-900 dark:text-red-100">
                  {summary.worstPosition.contributeTitle}
                </p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {summary.worstPosition.unrealizedPnLPercent.toFixed(2)}% (
                  {formatPortfolioValue(summary.worstPosition.unrealizedPnL)})
                </p>
              </Card>
            )}
          </div>
        )}
      </DashboardCard>

      {/* Positions List */}
      <DashboardCard className="space-y-4">
        <div className="flex items-center justify-between">
          <DashboardSectionTitle label="Positions" title="All Positions" />
          <Badge variant="secondary">{positions.length} positions</Badge>
        </div>

        {positions.length === 0 ? (
          <EmptyState
            title="No Positions Yet"
            description="Start investing in contributes to build your portfolio"
          />
        ) : (
          <div className="space-y-3">
            {positions.map((position) => (
              <PositionCard key={position.contributeId} position={position} />
            ))}
          </div>
        )}
      </DashboardCard>
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6">
        <AnalyticsDashboard />
      </TabsContent>
    </Tabs>
  );
}

function PositionCard({ position }: { position: PortfolioPosition }) {
  const isPositive = position.unrealizedPnL >= 0n;

  return (
    <Card className="group cursor-pointer rounded-2xl border border-border-subtle bg-surface p-4 transition-all duration-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 dark:hover:border-cyan-700">
      <Link to={`/pool/${position.postId}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-text-primary group-hover:text-indigo-600 dark:group-hover:text-cyan-400">
                {position.contributeTitle}
              </h3>
              <Badge variant={position.status === "open" ? "secondary" : "outline"}>
                {position.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs sm:gap-4 sm:text-sm">
              <div>
                <p className="text-xs text-text-muted">Shares</p>
                <p className="font-semibold text-text-primary">
                  {formatTokenAmount(position.shares)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Cost Basis</p>
                <p className="font-semibold text-text-primary">
                  {formatPortfolioValue(position.costBasis)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Current Value</p>
                <p className="font-semibold text-text-primary">
                  {formatPortfolioValue(position.currentValue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Unrealized PnL</p>
                <div className="flex items-center gap-1">
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <p className={`font-semibold ${
                    isPositive ? "text-emerald-500" : "text-red-500"
                  }`}>
                    {isPositive ? "+" : ""}
                    {position.unrealizedPnLPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="min-h-[44px] min-w-[80px] touch-manipulation"
          >
            <Link to={`/pool/${position.postId}/sell`}>
              Sell
            </Link>
          </Button>
        </div>
      </Link>
    </Card>
  );
}

