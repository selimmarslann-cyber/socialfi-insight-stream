import { Post, FeedResponse } from '@/types/feed';
import { TopGainer, MarketData } from '@/types/market';
import { TrendingUser } from '@/types/user';
import { BurnStats } from '@/types/admin';
import { generateRefCode } from '@/lib/utils';

// Mock data generators
export const mockPosts: Post[] = [
  {
    id: '1',
    author: {
      username: 'crypto_analyst',
      displayName: 'Ayla Tok',
      avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=160&q=60',
      score: 1250,
      refCode: generateRefCode(12345),
      verified: true,
    },
    content:
      'BTC reclaiming weekly VWAP. Funding cooling, perp premium back to neutral. Accumulating spot from 41.8k with 43.6k target. #Bitcoin #OnChain',
    images: [
      'https://images.unsplash.com/photo-1614034178878-5078c5dabe52?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1642104704075-10c2d3315327?auto=format&fit=crop&w=1200&q=80',
    ],
    score: 89,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    contributedAmount: 14500,
    tags: ['#Bitcoin', '#FundingRates', '#Macro'],
    engagement: { upvotes: 128, comments: 24, tips: 12, shares: 18 },
  },
  {
    id: '2',
    author: {
      username: 'defi_hunter',
      displayName: 'Emir Kaplan',
      avatar: 'https://images.unsplash.com/photo-1573497491208-6b1acb260507?auto=format&fit=crop&w=160&q=60',
      score: 980,
      refCode: generateRefCode(24680),
      verified: true,
    },
    content:
      'zkSync ecosystem yield map updated. Sequencer fees trending down, Ethena vault now paying 18% delta-neutral. Dropping my spreadsheet + top 3 pools.',
    score: 65,
    taskId: '420',
    images: [
      'https://images.unsplash.com/photo-1618005198919-d3d4b5a92eee?auto=format&fit=crop&w=1200&q=80',
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    contributedAmount: 0,
    tags: ['#DeFi', '#Yield', '#zkSync'],
    engagement: { upvotes: 86, comments: 19, tips: 6, shares: 11 },
  },
  {
    id: '3',
    author: {
      username: 'nft_collector',
      displayName: 'Mira Soyer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=60',
      score: 750,
      refCode: generateRefCode(98765),
      verified: false,
    },
    content:
      'ETH gas back under 12 gwei. Rotating profits into curated NFT treasuries. Watch wallets currently hoarding ETH for airdrop farming. Thread below.',
    images: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=1200&q=80',
    ],
    score: 54,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    contributedAmount: 6200,
    tags: ['#NFT', '#ETH', '#Gas'],
    engagement: { upvotes: 64, comments: 12, tips: 4, shares: 9 },
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
  { username: 'crypto_analyst', score: 1250, rank: 1, refCode: generateRefCode(12345), trend: 'up' },
  { username: 'defi_hunter', score: 980, rank: 2, refCode: generateRefCode(24680), trend: 'stable' },
  { username: 'nft_collector', score: 750, rank: 3, refCode: generateRefCode(98765), trend: 'up' },
  { username: 'whale_watcher', score: 680, rank: 4, refCode: generateRefCode(13579), trend: 'down' },
  { username: 'chain_expert', score: 620, rank: 5, refCode: generateRefCode(19283), trend: 'up' },
  { username: 'token_researcher', score: 590, rank: 6, refCode: generateRefCode(56473), trend: 'stable' },
  { username: 'market_maker', score: 540, rank: 7, refCode: generateRefCode(90817), trend: 'up' },
  { username: 'protocol_dev', score: 500, rank: 8, refCode: generateRefCode(72645), trend: 'stable' },
  { username: 'yield_farmer', score: 480, rank: 9, refCode: generateRefCode(38495), trend: 'down' },
  { username: 'smart_trader', score: 460, rank: 10, refCode: generateRefCode(11223), trend: 'stable' },
];

export const mockBurnStats: BurnStats = {
  total: 125_000_000,
  last24h: 450_000,
  updatedAt: new Date().toISOString(),
  series: Array.from({ length: 14 }).map((_, index) => ({
    t: Date.now() - (13 - index) * 60 * 60 * 1000,
    v: 250_000 + Math.sin(index / 2) * 50_000 + Math.random() * 20_000,
  })),
};

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

