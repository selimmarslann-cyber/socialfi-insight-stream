import { supabase } from "@/lib/supabaseClient";

export type PoolAnalytics = {
  poolAddress: string;
  totalPositions: number;
  totalBuyVolume?: number;
  totalSellVolume?: number;
  uniqueWallets: number;
  firstActivityAt?: string;
  lastActivityAt?: string;
  avgPositionSize?: number;
  buySellRatio?: number;
  uniqueDaysActive?: number;
  last24hVolume?: number;
  last7dVolume?: number;
};

/**
 * Gets pool analytics for a contribute by its ID.
 * Aggregates data from onchain_positions table.
 */
export async function getPoolAnalyticsForContribute(
  contributeId: string,
): Promise<PoolAnalytics | null> {
  const client = supabase;
  if (!client) {
    return null;
  }

  try {
    const { data, error } = await client
      .from("onchain_positions")
      .select("pool_address, side, amount, opened_at, wallet_address")
      .eq("contribute_id", contributeId);

    if (error) {
      console.warn("[poolAnalytics] Failed to fetch positions", error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const positions = data;
    const totalPositions = positions.length;
    const uniqueWallets = new Set(positions.map((p) => p.wallet_address?.toLowerCase())).size;

    let totalBuyVolume = 0;
    let totalSellVolume = 0;
    const timestamps: string[] = [];

    for (const pos of positions) {
      const amount = Number(pos.amount ?? 0);
      if (pos.side === "BUY") {
        totalBuyVolume += amount;
      } else if (pos.side === "SELL") {
        totalSellVolume += amount;
      }
      if (pos.opened_at) {
        timestamps.push(pos.opened_at);
      }
    }

    timestamps.sort();
    const firstActivityAt = timestamps[0] ?? undefined;
    const lastActivityAt = timestamps[timestamps.length - 1] ?? undefined;

    // Calculate additional metrics
    const totalVolume = totalBuyVolume + totalSellVolume;
    const avgPositionSize = totalPositions > 0 ? totalVolume / totalPositions : undefined;
    
    const buyCount = positions.filter((p) => p.side === "BUY").length;
    const sellCount = positions.filter((p) => p.side === "SELL").length;
    const buySellRatio = sellCount > 0 ? buyCount / sellCount : buyCount > 0 ? buyCount : undefined;

    // Unique days active
    const uniqueDays = new Set(
      timestamps.map((ts) => new Date(ts).toISOString().split("T")[0])
    ).size;
    const uniqueDaysActive = uniqueDays;

    // Last 24h and 7d volume
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let last24hVolume = 0;
    let last7dVolume = 0;

    for (const pos of positions) {
      if (!pos.opened_at) continue;
      const openedAt = new Date(pos.opened_at);
      const amount = Number(pos.amount ?? 0);
      
      if (openedAt >= last24h) {
        last24hVolume += amount;
      }
      if (openedAt >= last7d) {
        last7dVolume += amount;
      }
    }

    return {
      poolAddress: positions[0]?.pool_address ?? "",
      totalPositions,
      totalBuyVolume: totalBuyVolume > 0 ? totalBuyVolume : undefined,
      totalSellVolume: totalSellVolume > 0 ? totalSellVolume : undefined,
      uniqueWallets,
      firstActivityAt,
      lastActivityAt,
      avgPositionSize,
      buySellRatio,
      uniqueDaysActive,
      last24hVolume: last24hVolume > 0 ? last24hVolume : undefined,
      last7dVolume: last7dVolume > 0 ? last7dVolume : undefined,
    };
  } catch (error) {
    console.warn("[poolAnalytics] Error computing analytics", error);
    return null;
  }
}

/**
 * Gets pool analytics by pool address.
 */
export async function getPoolAnalyticsByAddress(
  poolAddress: string,
): Promise<PoolAnalytics | null> {
  const client = supabase;
  if (!client) {
    return null;
  }

  try {
    const { data, error } = await client
      .from("onchain_positions")
      .select("pool_address, side, amount, opened_at, wallet_address")
      .eq("pool_address", poolAddress.toLowerCase());

    if (error) {
      console.warn("[poolAnalytics] Failed to fetch positions", error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const positions = data;
    const totalPositions = positions.length;
    const uniqueWallets = new Set(positions.map((p) => p.wallet_address?.toLowerCase())).size;

    let totalBuyVolume = 0;
    let totalSellVolume = 0;
    const timestamps: string[] = [];

    for (const pos of positions) {
      const amount = Number(pos.amount ?? 0);
      if (pos.side === "BUY") {
        totalBuyVolume += amount;
      } else if (pos.side === "SELL") {
        totalSellVolume += amount;
      }
      if (pos.opened_at) {
        timestamps.push(pos.opened_at);
      }
    }

    timestamps.sort();
    const firstActivityAt = timestamps[0] ?? undefined;
    const lastActivityAt = timestamps[timestamps.length - 1] ?? undefined;

    // Calculate additional metrics (same logic as above)
    const totalVolume = totalBuyVolume + totalSellVolume;
    const avgPositionSize = totalPositions > 0 ? totalVolume / totalPositions : undefined;
    
    const buyCount = positions.filter((p) => p.side === "BUY").length;
    const sellCount = positions.filter((p) => p.side === "SELL").length;
    const buySellRatio = sellCount > 0 ? buyCount / sellCount : buyCount > 0 ? buyCount : undefined;

    const uniqueDays = new Set(
      timestamps.map((ts) => new Date(ts).toISOString().split("T")[0])
    ).size;
    const uniqueDaysActive = uniqueDays;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let last24hVolume = 0;
    let last7dVolume = 0;

    for (const pos of positions) {
      if (!pos.opened_at) continue;
      const openedAt = new Date(pos.opened_at);
      const amount = Number(pos.amount ?? 0);
      
      if (openedAt >= last24h) {
        last24hVolume += amount;
      }
      if (openedAt >= last7d) {
        last7dVolume += amount;
      }
    }

    return {
      poolAddress,
      totalPositions,
      totalBuyVolume: totalBuyVolume > 0 ? totalBuyVolume : undefined,
      totalSellVolume: totalSellVolume > 0 ? totalSellVolume : undefined,
      uniqueWallets,
      firstActivityAt,
      lastActivityAt,
      avgPositionSize,
      buySellRatio,
      uniqueDaysActive,
      last24hVolume: last24hVolume > 0 ? last24hVolume : undefined,
      last7dVolume: last7dVolume > 0 ? last7dVolume : undefined,
    };
  } catch (error) {
    console.warn("[poolAnalytics] Error computing analytics", error);
    return null;
  }
}

