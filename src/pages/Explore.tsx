import { useMemo, useState } from 'react';
import { Search, Sparkles, LineChart, Flame, TrendingUp } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PostCard } from '@/components/feed/PostCard';
import { mockPosts, mockGainers, mockTrendingUsers } from '@/lib/mock-api';

type ExploreTab = 'all' | 'funded' | 'trending';

const filterPosts = (tab: ExploreTab, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  const sorted = [...mockPosts].sort((a, b) => {
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

const Explore = () => {
  const [tab, setTab] = useState<ExploreTab>('all');
  const [query, setQuery] = useState('');

  const posts = useMemo(() => filterPosts(tab, query), [tab, query]);

  const fundedVolume = mockPosts.reduce(
    (acc, item) => acc + (item.contributedAmount ?? 0),
    0
  );

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
              {mockPosts.length} signals · ${fundedVolume.toLocaleString()} NOP funded in 24h
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
              {posts.length === 0 ? (
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
              {mockGainers.slice(0, 4).map((asset) => (
                <div
                  key={asset.symbol}
                  className="flex items-center justify-between rounded-2xl border border-indigo-500/10 bg-slate-50 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{asset.symbol}</p>
                    <p className="text-xs text-slate-500">${asset.price.toLocaleString()}</p>
                  </div>
                  <Badge className="rounded-full bg-emerald-50 text-xs font-semibold text-emerald-600">
                    +{asset.changePercent}%
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-3xl border border-indigo-500/10 bg-white p-5 shadow-lg">
            <div className="flex items-center gap-3">
              <Flame className="h-5 w-5 text-rose-500" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Top 5 Users</p>
                <p className="text-xs text-slate-500">Based on engagement velocity</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {mockTrendingUsers.slice(0, 5).map((user) => (
                <div
                  key={user.username}
                  className="flex items-center justify-between rounded-2xl border border-indigo-500/10 bg-slate-50 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{user.username}</p>
                    <p className="text-xs text-slate-500">{user.refCode}</p>
                  </div>
                  <Badge
                    className="rounded-full bg-white text-xs font-semibold text-indigo-500 ring-1 ring-indigo-100"
                  >
                    {user.score}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-3xl border border-indigo-500/10 bg-white p-5 shadow-lg">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Trending tags</p>
                <p className="text-xs text-slate-500">Updated hourly</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {mockPosts
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
