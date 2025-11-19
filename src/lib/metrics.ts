import { supabase } from "@/lib/supabaseClient";
import { apiClient } from "@/lib/axios";

export type PlatformMetrics = {
  totalUsers: number;
  activePositions: number;
  reputationLeaders: number;
  burn7d: number;
  totalVolume24h: number;
  totalVolume7d: number;
  activePools: number;
  totalContributes: number;
};

/**
 * Fetch real platform metrics
 */
export async function fetchPlatformMetrics(): Promise<PlatformMetrics> {
  const client = supabase;
  if (!client) {
    // Fallback to API if Supabase not available
    try {
      const { data } = await apiClient.get<PlatformMetrics>("/metrics");
      return data || getDefaultMetrics();
    } catch {
      return getDefaultMetrics();
    }
  }

  try {
    // Fetch metrics in parallel
    const [
      usersResult,
      positionsResult,
      alphaResult,
      trades7dResult,
      trades24hResult,
      poolsResult,
      contributesResult,
    ] = await Promise.all([
      // Total users
      client
        .from("social_profiles")
        .select("id", { count: "exact", head: true }),
      
      // Active positions (open positions)
      client
        .from("onchain_positions")
        .select("id", { count: "exact", head: true })
        .is("closed_at", null),
      
      // Reputation leaders (users with alpha score > 60)
      client
        .from("alpha_metrics")
        .select("wallet_address", { count: "exact", head: true })
        .gt("alpha_score", 60),
      
      // 7-day volume
      client
        .from("nop_trades")
        .select("amount_nop")
        .gte("executed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // 24-hour volume
      client
        .from("nop_trades")
        .select("amount_nop")
        .gte("executed_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      
      // Active pools (contributes with pool enabled)
      client
        .from("contributes")
        .select("id", { count: "exact", head: true })
        .eq("pool_enabled", true),
      
      // Total contributes
      client
        .from("contributes")
        .select("id", { count: "exact", head: true }),
    ]);

    // Calculate 7-day burn (50% of fees)
    const trades7d = trades7dResult.data || [];
    const volume7d = trades7d.reduce((sum, trade) => {
      const amount = Number(trade.amount_nop || 0);
      return sum + amount;
    }, 0);
    const fees7d = volume7d * 0.01; // 1% fee
    const burn7d = fees7d * 0.5; // 50% burn

    // Calculate 24-hour volume
    const trades24h = trades24hResult.data || [];
    const volume24h = trades24h.reduce((sum, trade) => {
      const amount = Number(trade.amount_nop || 0);
      return sum + amount;
    }, 0);

    return {
      totalUsers: usersResult.count || 0,
      activePositions: positionsResult.count || 0,
      reputationLeaders: alphaResult.count || 0,
      burn7d: Math.round(burn7d),
      totalVolume24h: Math.round(volume24h),
      totalVolume7d: Math.round(volume7d),
      activePools: poolsResult.count || 0,
      totalContributes: contributesResult.count || 0,
    };
  } catch (error) {
    console.warn("[metrics] Failed to fetch metrics", error);
    return getDefaultMetrics();
  }
}

function getDefaultMetrics(): PlatformMetrics {
  return {
    totalUsers: 0,
    activePositions: 0,
    reputationLeaders: 0,
    burn7d: 0,
    totalVolume24h: 0,
    totalVolume7d: 0,
    activePools: 0,
    totalContributes: 0,
  };
}

/**
 * Format large numbers for display
 */
export function formatMetric(value: number, decimals: number = 1): string {
  if (value === 0) return "0";
  
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(decimals)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(decimals)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(decimals)}K`;
  }
  return value.toFixed(0);
}

