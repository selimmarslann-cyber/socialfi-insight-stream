import { supabase } from "@/lib/supabaseClient";
import { apiClient } from "@/lib/axios";
import { fetchWeeklyTrendingContributes } from "@/lib/contributes";
import { getTopAlphaUsers, getAlphaLabel } from "@/lib/alpha";

export type IntelligenceFeed = {
  market: {
    btcUsd?: number;
    ethUsd?: number;
    fearGreedIndex?: number;
    fearGreedClassification?: string;
  };
  nopSummary: {
    totalUsers: number;
    totalProfiles: number;
    totalContributes: number;
    totalPositions: number;
  };
  trendingContributes: Array<{
    id: string;
    title: string;
    createdAt: string;
    score?: number;
  }>;
  topAlphaUsers: Array<{
    walletAddress: string;
    alphaScore: number;
    label: string;
  }>;
};

/**
 * Fetches aggregated intelligence feed data.
 * Combines market data, NOP ecosystem metrics, trending contributes, and top alpha users.
 */
export async function fetchIntelligenceFeed(): Promise<IntelligenceFeed> {
  const client = supabase;

  // Market data
  let btcUsd: number | undefined;
  let ethUsd: number | undefined;
  let fearGreedIndex: number | undefined;
  let fearGreedClassification: string | undefined;

  try {
    const pricesRes = await apiClient.get<{ items: Array<{ symbol: string; price: number }> }>("/prices");
    const btc = pricesRes.data.items?.find((item) => item.symbol === "BTC");
    const eth = pricesRes.data.items?.find((item) => item.symbol === "ETH");
    btcUsd = btc?.price;
    ethUsd = eth?.price;
  } catch (error) {
    console.warn("[intelligenceFeed] Failed to fetch prices", error);
  }

  try {
    const fearGreedRes = await apiClient.get<{ item: { value: number; classification: string } | null }>("/fear-greed");
    if (fearGreedRes.data.item) {
      fearGreedIndex = fearGreedRes.data.item.value;
      fearGreedClassification = fearGreedRes.data.item.classification;
    }
  } catch (error) {
    console.warn("[intelligenceFeed] Failed to fetch fear & greed", error);
  }

  // NOP Summary
  let totalUsers = 0;
  let totalProfiles = 0;
  let totalContributes = 0;
  let totalPositions = 0;

  if (client) {
    try {
      const [profilesRes, postsRes, positionsRes] = await Promise.all([
        client.from("social_profiles").select("*", { count: "exact", head: true }),
        client.from("social_posts").select("*", { count: "exact", head: true }),
        client.from("onchain_positions").select("*", { count: "exact", head: true }),
      ]);

      totalProfiles = profilesRes.count ?? 0;
      totalUsers = totalProfiles; // Align with profiles for now
      totalContributes = postsRes.count ?? 0;
      totalPositions = positionsRes.count ?? 0;
    } catch (error) {
      console.warn("[intelligenceFeed] Failed to fetch NOP summary", error);
    }
  }

  // Trending Contributes
  let trendingContributes: IntelligenceFeed["trendingContributes"] = [];
  try {
    const trending = await fetchWeeklyTrendingContributes();
    trendingContributes = trending.slice(0, 5).map((item) => ({
      id: item.id,
      title: item.title,
      createdAt: item.createdAt ?? item.created_at ?? new Date().toISOString(),
      score: item.weeklyVolumeNop,
    }));
  } catch (error) {
    console.warn("[intelligenceFeed] Failed to fetch trending contributes", error);
  }

  // Top Alpha Users
  let topAlphaUsers: IntelligenceFeed["topAlphaUsers"] = [];
  try {
    const topAlpha = await getTopAlphaUsers(5);
    topAlphaUsers = topAlpha.map((user) => ({
      walletAddress: user.wallet_address,
      alphaScore: user.alpha_score,
      label: getAlphaLabel(user.alpha_score),
    }));
  } catch (error) {
    console.warn("[intelligenceFeed] Failed to fetch top alpha users", error);
  }

  return {
    market: {
      btcUsd,
      ethUsd,
      fearGreedIndex,
      fearGreedClassification,
    },
    nopSummary: {
      totalUsers,
      totalProfiles,
      totalContributes,
      totalPositions,
    },
    trendingContributes,
    topAlphaUsers,
  };
}

