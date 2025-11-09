import { Post, FeedResponse } from '@/types/feed';
import { TopGainer, MarketData } from '@/types/market';
import { TrendingUser } from '@/types/user';
import { BurnStats, BoostEvent } from '@/types/admin';

// Mock data generators
export const mockPosts: Post[] = [
  {
    id: '1',
    author: { username: 'crypto_analyst', avatar: '', score: 1250 },
    content: 'Bitcoin showing strong support at $42k. Bullish divergence on 4h chart. 📈 #BTC',
    score: 89,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    engagement: { upvotes: 42, comments: 8 },
  },
  {
    id: '2',
    author: { username: 'defi_hunter', avatar: '', score: 980 },
    content: 'Just completed task #420. New DeFi protocol analysis posted! Check out the yield opportunities. 🚀',
    score: 65,
    taskId: '420',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    engagement: { upvotes: 28, comments: 5 },
  },
  {
    id: '3',
    author: { username: 'nft_collector', avatar: '', score: 750 },
    content: 'Market sentiment shifting. ETH gas fees dropping = good time for NFT trades',
    score: 54,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    engagement: { upvotes: 19, comments: 3 },
  },
];

export const mockGainers: TopGainer[] = [
  { symbol: 'BTC/USDT', price: 42150.50, changePercent: 5.2 },
  { symbol: 'ETH/USDT', price: 2285.30, changePercent: 4.8 },
  { symbol: 'SOL/USDT', price: 98.75, changePercent: 8.3 },
  { symbol: 'AVAX/USDT', price: 36.20, changePercent: 6.1 },
  { symbol: 'MATIC/USDT', price: 0.89, changePercent: 3.5 },
];

export const mockTrendingUsers: TrendingUser[] = [
  { username: 'crypto_analyst', score: 1250, rank: 1, trend: 'up' },
  { username: 'defi_hunter', score: 980, rank: 2, trend: 'stable' },
  { username: 'nft_collector', score: 750, rank: 3, trend: 'up' },
  { username: 'whale_watcher', score: 680, rank: 4, trend: 'down' },
  { username: 'chain_expert', score: 620, rank: 5, trend: 'up' },
  { username: 'token_researcher', score: 590, rank: 6, trend: 'stable' },
  { username: 'market_maker', score: 540, rank: 7, trend: 'up' },
  { username: 'protocol_dev', score: 500, rank: 8, trend: 'stable' },
  { username: 'yield_farmer', score: 480, rank: 9, trend: 'down' },
  { username: 'smart_trader', score: 460, rank: 10, trend: 'stable' },
];

export const mockBurnStats: BurnStats = {
  totalBurned: 125000000,
  last24h: 450000,
  lastUpdate: new Date().toISOString(),
};

export const mockBoostEvents: BoostEvent[] = [
  {
    id: '1',
    title: 'Complete Your Profile',
    description: 'Add bio and avatar for 50 bonus points',
    multiplier: 1.5,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    active: true,
  },
  {
    id: '2',
    title: 'Rate 5 Contributions',
    description: '2x points for rating quality content',
    multiplier: 2.0,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
    active: true,
  },
];

// Mock API functions
export const fetchFeed = async (cursor?: string): Promise<FeedResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    items: mockPosts,
    nextCursor: cursor ? undefined : 'next-page',
  };
};

export const fetchTopGainers = async (): Promise<MarketData> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    gainers: mockGainers,
    lastUpdate: new Date().toISOString(),
  };
};

export const fetchTrendingUsers = async (): Promise<TrendingUser[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockTrendingUsers;
};

export const fetchBurnStats = async (): Promise<BurnStats> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return mockBurnStats;
};

export const fetchBoostEvents = async (): Promise<BoostEvent[]> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return mockBoostEvents;
};
