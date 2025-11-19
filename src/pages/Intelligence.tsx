import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Activity, TrendingUp, Users, BarChart3 } from "lucide-react";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { fetchIntelligenceFeed } from "@/lib/intelligenceFeed";
import { Link } from "react-router-dom";
import { SocialPriceCorrelationCard } from "@/components/analytics/SocialPriceCorrelationCard";

export default function Intelligence() {
  usePageMetadata({
    title: "Intelligence Feed — NOP Intelligence Layer",
    description: "Aggregated market data, trending contributes, and top alpha users.",
  });

  const feedQuery = useQuery({
    queryKey: ["intelligence-feed"],
    queryFn: fetchIntelligenceFeed,
    staleTime: 60_000,
  });

  const feed = feedQuery.data;
  const market = feed?.market ?? {};
  const nopSummary = feed?.nopSummary ?? { totalContributes: 0, totalPositions: 0, totalUsers: 0, totalProfiles: 0 };
  const trending = feed?.trendingContributes ?? [];
  const topAlpha = feed?.topAlphaUsers ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-card-soft">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-indigo-400" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Intelligence Layer</p>
            <h1 className="text-2xl font-semibold text-text-primary">Intelligence Feed</h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-text-secondary">
          Aggregated market signals, trending contributes, and top alpha operators.
        </p>
      </div>

      {/* Market Snapshot */}
      <Card className="rounded-3xl border border-border bg-card p-6 shadow-card-soft">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-text-primary">Market Snapshot</h2>
        </div>
        {feedQuery.isLoading ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">BTC</p>
              <p className="text-2xl font-semibold text-text-primary">
                {market.btcUsd ? `$${market.btcUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">ETH</p>
              <p className="text-2xl font-semibold text-text-primary">
                {market.ethUsd ? `$${market.ethUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Fear & Greed</p>
              <p className="text-2xl font-semibold text-text-primary">
                {market.fearGreedIndex ?? "—"}
              </p>
              {market.fearGreedClassification ? (
                <p className="text-xs text-text-secondary">{market.fearGreedClassification}</p>
              ) : null}
            </div>
          </div>
        )}
      </Card>

      {/* NOP Ecosystem */}
      <Card className="rounded-3xl border border-border bg-card p-6 shadow-card-soft">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-text-primary">NOP Ecosystem</h2>
        </div>
        {feedQuery.isLoading ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Total Positions</p>
              <p className="text-2xl font-semibold text-text-primary">{nopSummary.totalPositions}</p>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Total Contributes</p>
              <p className="text-2xl font-semibold text-text-primary">{nopSummary.totalContributes}</p>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Total Users</p>
              <p className="text-2xl font-semibold text-text-primary">{nopSummary.totalUsers}</p>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Active Alpha</p>
              <p className="text-2xl font-semibold text-text-primary">
                {topAlpha.length > 0 ? topAlpha.length : "—"}
              </p>
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        {/* Trending Contributes */}
        <Card className="rounded-3xl border border-border bg-card p-6 shadow-card-soft">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-text-primary">Trending Contributes</h2>
          </div>
          {feedQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : trending.length > 0 ? (
            <div className="space-y-3">
              {trending.map((contribute) => (
                <Link
                  key={contribute.id}
                  to={`/contributes#${contribute.id}`}
                  className="block rounded-2xl border border-border-subtle bg-card/70 p-4 transition hover:border-indigo-300 hover:bg-card"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-text-primary">{contribute.title}</p>
                      {contribute.score ? (
                        <p className="text-xs text-text-secondary">
                          {contribute.score.toFixed(2)} NOP volume (7d)
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="secondary" className="rounded-full">
                      #{contribute.id}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No trending contributes yet.</p>
          )}
        </Card>

        {/* Top Alpha Users */}
        <Card className="rounded-3xl border border-border bg-card p-6 shadow-card-soft">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-text-primary">Top Alpha Users</h2>
          </div>
          {feedQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : topAlpha.length > 0 ? (
            <div className="space-y-3">
              {topAlpha.map((user, index) => (
                <Link
                  key={user.walletAddress}
                  to={`/u/${user.walletAddress}`}
                  className="flex items-center justify-between rounded-2xl border border-border-subtle bg-card/70 p-3 transition hover:border-indigo-300 hover:bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-xs font-semibold">
                        #{index + 1}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {user.walletAddress.slice(0, 6)}…{user.walletAddress.slice(-4)}
                      </p>
                      <p className="text-xs text-text-secondary">{user.label}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-indigo-400">
                      {Math.round(user.alphaScore)}
                    </p>
                    <p className="text-xs text-text-secondary">Alpha</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No alpha users yet.</p>
          )}
        </Card>
      </div>

      {/* Social → Price Correlation */}
      <SocialPriceCorrelationCard windowDays={7} />
    </div>
  );
}

