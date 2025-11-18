import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PostCard } from "@/components/feed/PostCard";
import { mockPosts } from "@/lib/mock-api";
import { useFeedStore } from "@/lib/store";
import type { Post } from "@/types/feed";
import { PUBLIC_ENV } from "@/config/env";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/ui/status-pill";

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
            <p className="text-sm-2 leading-relaxed text-text-secondary">
            Curated intelligence from the community. Funded posts surface first, trending by real-time momentum.
          </p>
        </div>
        <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search protocols, creators, hashtags…"
              className="h-12 border border-border-subtle bg-surface pl-11 pr-4 text-sm-2 shadow-subtle placeholder:text-text-muted"
          />
        </div>
          <div className="flex flex-wrap items-center gap-2 text-xs-2 text-text-secondary">
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent-start)]" />
          {mockPosts.length} signals · ${fundedVolume.toLocaleString()} NOP funded in 24h
        </div>
          <div className="inline-flex rounded-pill border border-border-subtle bg-surface-muted p-1 text-sm font-semibold text-text-secondary">
          {["all", "funded", "trending"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTab(option as ExploreTab)}
              className={cn(
                  "min-w-[90px] rounded-pill px-4 py-1 capitalize transition",
                  tab === option ? "bg-surface text-text-primary shadow-subtle" : "text-text-muted",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </DashboardCard>

        <div className="space-y-4">
            <DashboardCard className="space-y-4">
              <DashboardSectionTitle label="Signals" title="Community posts" />
              {posts.length === 0 ? (
                <div className="rounded-card border border-dashed border-ring-subtle/60 bg-accent-soft/40 p-8 text-center text-sm-2 text-text-secondary">
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

          <DashboardCard>
            <DashboardSectionTitle label="Market" title="Top gainers" />
            <div className="space-y-3">
              {marketLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`gainer-skeleton-${index}`}
                      className="h-14 rounded-card border border-dashed border-border-subtle bg-surface-muted"
                    />
                  ))
                : null}

              {!marketLoading && marketError ? (
                <p className="text-xs-2 font-semibold text-error">{marketError}</p>
              ) : null}

              {!marketLoading && !marketError && topGainers.length === 0 ? (
                <p className="text-xs-2 text-text-muted">No live market data right now.</p>
              ) : null}

              {!marketLoading && !marketError
                ? topGainers.map((asset) => {
                    const isUp = asset.change24h >= 0;
                    return (
                      <div
                        key={asset.symbol}
                        className="flex items-center justify-between rounded-[16px] border border-border-subtle bg-surface px-3 py-2 text-sm-2 text-text-secondary"
                      >
                        <div>
                          <p className="font-semibold text-text-primary">{asset.symbol}</p>
                          <p className="text-xs-2 text-text-secondary">{formatPrice(asset.price)}</p>
                        </div>
                        <StatusPill tone={isUp ? "success" : "danger"}>{formatChange(asset.change24h)}</StatusPill>
                      </div>
                    );
                  })
                : null}
            </div>
          </DashboardCard>

        <DashboardCard>
          <DashboardSectionTitle label="Signals" title="Trending tags" />
          <div className="flex flex-wrap gap-2">
            {combinedPosts
              .flatMap((post) => post.tags ?? [])
              .slice(0, 12)
              .map((tag) => (
                <StatusPill key={tag} className="bg-accent-soft text-text-primary ring-0">
                  #{tag.replace(/^#/, "")}
                </StatusPill>
              ))}
          </div>
        </DashboardCard>
        </div>
    </div>
  );
};

export default Explore;
