import { Post, FeedResponse } from "@/types/feed";
import { TopGainer, MarketData } from "@/types/market";
import { TrendingUser } from "@/types/user";
import { BurnStats } from "@/types/admin";
import { generateRefCode } from "@/lib/utils";
import { computeAIFromRules, type AIRuleInput } from "@/lib/ai/ruleBasedEngine";

type MockPostSeed = Post & { aiContext?: AIRuleInput };

const mockPostSeeds: MockPostSeed[] = [
  {
    id: "1",
    author: {
      username: "crypto_analyst",
      displayName: "Ayla Tok",
      avatar:
        "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=160&q=60",
      score: 1250,
      refCode: generateRefCode(12345),
      verified: true,
    },
    content:
      "BTC reclaiming weekly VWAP. Funding cooling, perp premium back to neutral. Accumulating spot from 41.8k with 43.6k target. #Bitcoin #OnChain",
    images: [
      "https://images.unsplash.com/photo-1614034178878-5078c5dabe52?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1642104704075-10c2d3315327?auto=format&fit=crop&w=1200&q=80",
    ],
    score: 89,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    contributedAmount: 14500,
    tags: ["#Bitcoin", "#FundingRates", "#Macro"],
    aiSignal: "Bullish",
    aiVolatility: "Low",
    aiMmActivity: "Positive",
    aiScore: 78,
    aiContext: {
      symbol: "BTC",
      priceChange24h: 3.8,
      volumeChange24h: 12.5,
      fundingRate: 0.018,
      sentimentHint: "bullish",
    },
    engagement: { upvotes: 128, comments: 24, tips: 12, shares: 18 },
  },
  {
    id: "2",
    author: {
      username: "defi_hunter",
      displayName: "Emir Kaplan",
      avatar:
        "https://images.unsplash.com/photo-1573497491208-6b1acb260507?auto=format&fit=crop&w=160&q=60",
      score: 980,
      refCode: generateRefCode(24680),
      verified: true,
    },
    content:
      "zkSync ecosystem yield map updated. Sequencer fees trending down, Ethena vault now paying 18% delta-neutral. Dropping my spreadsheet + top 3 pools.",
    score: 65,
    taskId: "420",
    images: [
      "https://images.unsplash.com/photo-1618005198919-d3d4b5a92eee?auto=format&fit=crop&w=1200&q=80",
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    contributedAmount: 0,
    tags: ["#DeFi", "#Yield", "#zkSync"],
    aiSignal: "Neutral",
    aiVolatility: "Medium",
    aiMmActivity: "Neutral",
    aiScore: 64,
    aiContext: {
      symbol: "ZKS",
      priceChange24h: 1.4,
      volumeChange24h: 5.2,
      fundingRate: -0.003,
      sentimentHint: "neutral",
    },
    engagement: { upvotes: 86, comments: 19, tips: 6, shares: 11 },
  },
  {
    id: "3",
    author: {
      username: "nft_collector",
      displayName: "Mira Soyer",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=60",
      score: 750,
      refCode: generateRefCode(98765),
      verified: false,
    },
    content:
      "ETH gas back under 12 gwei. Rotating profits into curated NFT treasuries. Watch wallets currently hoarding ETH for airdrop farming. Thread below.",
    images: [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=1200&q=80",
    ],
    score: 54,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    contributedAmount: 6200,
    tags: ["#NFT", "#ETH", "#Gas"],
    aiSignal: undefined,
    aiVolatility: undefined,
    aiMmActivity: undefined,
    aiScore: undefined,
    aiContext: {
      symbol: "ETH",
      priceChange24h: -2.1,
      volumeChange24h: 7.8,
      fundingRate: -0.01,
      sentimentHint: "bearish",
    },
    engagement: { upvotes: 64, comments: 12, tips: 4, shares: 9 },
  },
];

const inferSentimentHint = (content: string): AIRuleInput["sentimentHint"] => {
  const normalized = content.toLowerCase();
  if (normalized.includes("bear") || normalized.includes("sell")) {
    return "bearish";
  }
  if (normalized.includes("bull") || normalized.includes("accum")) {
    return "bullish";
  }
  return "neutral";
};

const buildPostWithAI = (seed: MockPostSeed): Post => {
  const aiInput: AIRuleInput = {
    symbol:
      seed.aiContext?.symbol ?? seed.tags?.[0]?.replace("#", "").toUpperCase(),
    priceChange24h: seed.aiContext?.priceChange24h ?? (seed.score - 50) / 2,
    volumeChange24h:
      seed.aiContext?.volumeChange24h ??
      (seed.engagement.upvotes + seed.engagement.tips) / 6,
    fundingRate: seed.aiContext?.fundingRate ?? 0,
    sentimentHint:
      seed.aiContext?.sentimentHint ?? inferSentimentHint(seed.content),
  };

  const ai = computeAIFromRules(aiInput);

  const attachments = seed.attachments ?? seed.images ?? [];

  return {
    ...seed,
    images: seed.images ?? attachments,
    attachments,
    aiSignal: seed.aiSignal ?? ai.aiSignal,
    aiVolatility: seed.aiVolatility ?? ai.aiVolatility,
    aiMmActivity: seed.aiMmActivity ?? ai.aiMmActivity,
    aiScore: seed.aiScore ?? ai.aiScore,
    aiLastUpdatedAt: seed.aiLastUpdatedAt ?? ai.aiLastUpdatedAt,
  };
};

const buildMockPosts = (): Post[] => mockPostSeeds.map(buildPostWithAI);

// Mock data generators
export const mockPosts: Post[] = buildMockPosts();

export const mockGainers: TopGainer[] = [
  { symbol: "BTC/USDT", price: 42150.5, changePercent: 5.2 },
  { symbol: "ETH/USDT", price: 2285.3, changePercent: 4.8 },
  { symbol: "SOL/USDT", price: 98.75, changePercent: 8.3 },
  { symbol: "AVAX/USDT", price: 36.2, changePercent: 6.1 },
  { symbol: "MATIC/USDT", price: 0.89, changePercent: 3.5 },
];

export const mockTrendingUsers: TrendingUser[] = [
  {
    username: "signalqueen",
    score: 18_950,
    rank: 1,
    refCode: generateRefCode(11890),
    trend: "up",
  },
  {
    username: "layer2labs",
    score: 17_540,
    rank: 2,
    refCode: generateRefCode(22010),
    trend: "up",
  },
  {
    username: "yieldsmith",
    score: 16_220,
    rank: 3,
    refCode: generateRefCode(33901),
    trend: "stable",
  },
  {
    username: "airdropalpha",
    score: 14_980,
    rank: 4,
    refCode: generateRefCode(49221),
    trend: "down",
  },
  {
    username: "nopwhale",
    score: 13_740,
    rank: 5,
    refCode: generateRefCode(56004),
    trend: "up",
  },
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
    items: buildMockPosts(),
    nextCursor: cursor ? undefined : "next-page",
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
