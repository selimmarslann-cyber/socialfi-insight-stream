import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PostCard } from "@/components/feed/PostCard";
import { mockPosts } from "@/lib/mock-api";
import { useFeedStore } from "@/lib/store";
import type { Post } from "@/types/feed";
import { PUBLIC_ENV } from "@/config/env";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { cn } from "@/lib/utils";

type ExploreTab = 'all' | 'funded' | 'trending';

const filterPosts = (dataset: Post[], tab: ExploreTab, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  const sorted = [...dataset].sort((a, b) => {
    const contributedDiff = (b.contributedAmount ?? 0) - (a.contributedAmount ?? 0);
    if (contributedDiff !== 0) return contributedDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filtered = normalizedQuery
    ? sorted.filter((post) => {
        const content = post.content.toLowerCase();
        const author = `${post.author.displayName} ${post.author.username}`.toLowerCase();
        const tags = (post.tags ?? []).join(' ').toLowerCase();
        return (
          content.includes(normalizedQuery) ||
          author.includes(normalizedQuery) ||
          tags.includes(normalizedQuery)
        );
      })
    : sorted;

  if (tab === 'funded') {
    return filtered.filter((post) => (post.contributedAmount ?? 0) > 0);
  }

  if (tab === 'trending') {
    const now = Date.now();
    return filtered
      .map((post) => {
        const hoursAgo = (now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
        const recencyMultiplier = Math.max(0.2, 1 - hoursAgo / 24);
        const score =
          post.engagement.upvotes +
          post.engagement.comments * 1.5 +
          post.engagement.tips * 3 +
          post.engagement.shares * 2;
        return { post, trendingScore: score * recencyMultiplier };
      })
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .map((entry) => entry.post);
  }

  return filtered;
};

type MarketRow = {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  signal: 'Bullish' | 'Neutral' | 'Bearish';
  score: number;
};

const API_BASE = PUBLIC_ENV.apiBase || '/api';

const Explore = () => {
  const userPosts = useFeedStore((state) => state.userPosts);
  const [tab, setTab] = useState<ExploreTab>("all");
  const [query, setQuery] = useState("");
  const [marketItems, setMarketItems] = useState<MarketRow[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);

  const combinedPosts = useMemo(() => [...userPosts, ...mockPosts], [userPosts]);

  const posts = useMemo(
    () => filterPosts(combinedPosts, tab, query),
    [combinedPosts, tab, query],
  );

  const fundedVolume = combinedPosts.reduce(
    (acc, item) => acc + (item.contributedAmount ?? 0),
    0
  );

  const loadMarkets = useCallback(async () => {
    setMarketLoading(true);
    setMarketError(null);
    try {
      const response = await fetch(`${API_BASE}/prices`);
      if (!response.ok) {
        throw new Error(`prices_${response.status}`);
      }
      const payload = (await response.json()) as { items?: MarketRow[] };
      setMarketItems(payload.items ?? []);
    } catch (error) {
      console.warn("Top gainers fetch failed", error);
      setMarketItems([]);
      setMarketError("Market data unavailable. Retry soon.");
    } finally {
      setMarketLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMarkets();
  }, [loadMarkets]);

  const topGainers = useMemo(
    () => [...marketItems].sort((a, b) => b.change24h - a.change24h).slice(0, 4),
    [marketItems],
  );

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: value >= 1000 ? 0 : 2,
    }).format(value);

  const formatChange = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-5">
      <DashboardCard className="space-y-4">
        <div className="space-y-2">
          <DashboardSectionTitle label="Discovery" title="Explore SocialFi Alpha" />
          <p className="text-sm text-slate-500">
            Curated intelligence from the community. Funded posts surface first, trending by real-time momentum.
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search protocols, creators, hashtags…"
            className="h-12 rounded-full border border-slate-200/70 bg-slate-50 pl-11 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-100"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          {mockPosts.length} signals · ${fundedVolume.toLocaleString()} NOP funded in 24h
        </div>
        <div className="inline-flex rounded-full border border-slate-200/70 bg-slate-50 p-1 text-sm font-semibold text-slate-500">
          {["all", "funded", "trending"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTab(option as ExploreTab)}
              className={cn(
                "min-w-[90px] rounded-full px-4 py-1 capitalize transition",
                tab === option ? "bg-white text-slate-900 shadow-sm" : "",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </DashboardCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <DashboardCard className="space-y-4">
          <DashboardSectionTitle label="Signals" title="Community Posts" />
          {posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/40 p-10 text-center text-sm text-slate-500">
              Nothing surfaced with that filter yet. Try a broader query.
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </DashboardCard>

        <div className="space-y-4">
          <DashboardCard>
            <DashboardSectionTitle label="Market" title="Top Gainers" />
            <div className="space-y-3">
              {marketLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div key={`gainer-skeleton-${index}`} className="h-14 rounded-2xl border border-dashed border-slate-200 bg-slate-50" />
                  ))
                : null}

              {!marketLoading && marketError ? (
                <p className="text-xs font-semibold text-amber-600">{marketError}</p>
              ) : null}

              {!marketLoading && !marketError && topGainers.length === 0 ? (
                <p className="text-xs text-slate-500">No live market data right now.</p>
              ) : null}

              {!marketLoading && !marketError
                ? topGainers.map((asset) => {
                    const isUp = asset.change24h >= 0;
                    return (
                      <div
                        key={asset.symbol}
                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{asset.symbol}</p>
                          <p className="text-xs text-slate-500">{formatPrice(asset.price)}</p>
                        </div>
                        <Badge
                          className={cn(
                            "rounded-full text-xs font-semibold",
                            isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600",
                          )}
                        >
                          {formatChange(asset.change24h)}
                        </Badge>
                      </div>
                    );
                  })
                : null}
            </div>
          </DashboardCard>

          <DashboardCard>
            <DashboardSectionTitle label="Signals" title="Trending Tags" />
            <div className="flex flex-wrap gap-2">
              {combinedPosts
                .flatMap((post) => post.tags ?? [])
                .slice(0, 12)
                .map((tag) => (
                  <span key={tag} className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                    {tag}
                  </span>
                ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
};

export default Explore;
