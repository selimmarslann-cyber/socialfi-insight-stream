import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles, LineChart, TrendingUp } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PostCard } from '@/components/feed/PostCard';
import { mockPosts } from '@/lib/mock-api';
import { fetchFeed } from '@/lib/feed-service';
import TopUsersCard from '@/components/TopUsersCard';
import { useFeedStore } from '@/lib/store';
import type { Post } from '@/types/feed';
import { PUBLIC_ENV } from '@/config/env';

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
  const {
    data: feedData,
    isLoading: feedLoading,
  } = useQuery({
    queryKey: ['explore-feed'],
    queryFn: () => fetchFeed({ limit: 40 }),
  });
  const [tab, setTab] = useState<ExploreTab>('all');
  const [query, setQuery] = useState('');
  const [marketItems, setMarketItems] = useState<MarketRow[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);

  const remotePosts = feedData?.items ?? mockPosts;
  const combinedPosts = useMemo(
    () => [...userPosts, ...remotePosts],
    [userPosts, remotePosts],
  );

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
      console.warn('Top gainers fetch failed', error);
      setMarketItems([]);
      setMarketError('Market data unavailable. Retry soon.');
    } finally {
      setMarketLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMarkets();
  }, [loadMarkets]);

  const topGainers = useMemo(
    () =>
      [...marketItems].sort((a, b) => b.change24h - a.change24h).slice(0, 4),
    [marketItems],
  );

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: value >= 1000 ? 0 : 2,
    }).format(value);

  const formatChange = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <Container>
      <div className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-slate-900">Explore SocialFi Alpha</h1>
            <p className="text-sm text-slate-500">
              Curated insights from the community. Funded posts surface first, trending by real-time momentum.
            </p>
          </div>

          <div className="rounded-3xl border border-indigo-500/10 bg-white p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search protocols, creators, hashtags…"
                className="h-12 rounded-2xl border-none bg-slate-100 pl-11 text-sm shadow-inner focus-visible:ring-2 focus-visible:ring-indigo-200"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              {`${remotePosts.length} signals · $${fundedVolume.toLocaleString()} NOP funded in 24h`}
            </div>
          </div>

            <Tabs value={tab} onValueChange={(value) => setTab(value as ExploreTab)}>
              <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-slate-100 p-1">
                <TabsTrigger value="all" className="rounded-2xl text-sm">
                  All
                </TabsTrigger>
                <TabsTrigger value="funded" className="rounded-2xl text-sm">
                  Funded
                </TabsTrigger>
                <TabsTrigger value="trending" className="rounded-2xl text-sm">
                  Trending
                </TabsTrigger>
              </TabsList>
              <TabsContent value={tab} className="mt-6 space-y-5">
                {feedLoading && !feedData ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Card
                        key={`explore-feed-skeleton-${index}`}
                        className="h-36 animate-pulse rounded-3xl border border-indigo-50 bg-slate-50"
                      />
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <Card className="rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/40 p-10 text-center text-sm text-slate-500">
                    Nothing surfaced with that filter yet. Try a broader query.
                  </Card>
                ) : (
                  posts.map((post) => <PostCard key={post.id} post={post} />)
                )}
              </TabsContent>
            </Tabs>
        </section>

          <aside className="space-y-6">
            <Card className="rounded-3xl border border-indigo-500/10 bg-white p-5 shadow-lg">
            <div className="flex items-center gap-3">
              <LineChart className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Top Gainers</p>
                <p className="text-xs text-slate-500">24h price movers</p>
              </div>
            </div>
              <div className="mt-4 space-y-3">
                {marketLoading && (
                  <>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={`skeleton-${index}`}
                        className="h-14 rounded-2xl border border-dashed border-slate-200 bg-slate-50 animate-pulse"
                      />
                    ))}
                  </>
                )}

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
                          className="flex items-center justify-between rounded-2xl border border-indigo-500/10 bg-slate-50 px-3 py-2 text-sm"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">{asset.symbol}</p>
                            <p className="text-xs text-slate-500">{formatPrice(asset.price)}</p>
                          </div>
                          <Badge
                            className={`rounded-full text-xs font-semibold ${
                              isUp
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {formatChange(asset.change24h)}
                          </Badge>
                        </div>
                      );
                    })
                  : null}
              </div>
          </Card>

            <TopUsersCard title="Top 5 Users" period="weekly" limit={5} />

          <Card className="rounded-3xl border border-indigo-500/10 bg-white p-5 shadow-lg">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Trending tags</p>
                <p className="text-xs text-slate-500">Updated hourly</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                {combinedPosts
                .flatMap((post) => post.tags ?? [])
                .slice(0, 10)
                .map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600"
                  >
                    {tag}
                  </span>
                ))}
            </div>
          </Card>
        </aside>
      </div>
    </Container>
  );
};

export default Explore;
