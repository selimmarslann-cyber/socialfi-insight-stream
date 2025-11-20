/**
 * Fair Data Validation & Averaging
 * Ensures data is fair, average-based, and doesn't create inflation
 */

import { supabase } from "@/lib/supabaseClient";

export type FairDataConfig = {
  minValue: number;
  maxValue: number;
  averageValue: number;
  standardDeviation: number;
};

/**
 * Calculate fair average from historical data
 */
export async function calculateFairAverage(
  metric: "posts" | "trades" | "volume" | "followers" | "rewards",
  period: "day" | "week" | "month" = "week"
): Promise<number> {
  if (!supabase) {
    return 0;
  }

  try {
    let startDate: Date;
    switch (period) {
      case "day":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        break;
      case "week":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    let query;
    switch (metric) {
      case "posts":
        query = supabase
          .from("social_posts")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString());
        break;
      case "trades":
        query = supabase
          .from("pool_positions")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString());
        break;
      case "volume":
        query = supabase
          .from("pool_positions")
          .select("cost_basis")
          .gte("created_at", startDate.toISOString());
        break;
      case "followers":
        query = supabase
          .from("follows")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString());
        break;
      case "rewards":
        query = supabase
          .from("creator_earnings")
          .select("amount")
          .gte("created_at", startDate.toISOString());
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error("[fairData] Error calculating average", error);
      return 0;
    }

    if (metric === "volume" || metric === "rewards") {
      const values = (data as { cost_basis?: number; amount?: number }[]) || [];
      const sum = values.reduce((acc, item) => acc + Number(item.cost_basis || item.amount || 0), 0);
      const count = values.length;
      return count > 0 ? sum / count : 0;
    } else {
      const count = (data as { count?: number })?.count || 0;
      // Get unique users count
      const { count: userCount } = await supabase
        .from("social_profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString());
      return userCount && userCount > 0 ? count / userCount : 0;
    }
  } catch (error) {
    console.error("[fairData] Error calculating fair average", error);
    return 0;
  }
}

/**
 * Validate and normalize reward amount to prevent inflation
 */
export function normalizeReward(amount: number, metric: "referral" | "badge" | "task"): number {
  // Base rewards (in NOP)
  const BASE_REWARDS = {
    referral: 10,
    badge: 5,
    task: 20,
  };

  const baseReward = BASE_REWARDS[metric];
  
  // Apply fair scaling (logarithmic to prevent inflation)
  // More rewards = less value per reward
  const scaleFactor = Math.log10(Math.max(amount / baseReward, 1) + 1) / Math.log10(2);
  const normalized = baseReward / scaleFactor;

  // Cap at reasonable maximum
  const MAX_REWARDS = {
    referral: 50,
    badge: 25,
    task: 100,
  };

  return Math.min(normalized, MAX_REWARDS[metric]);
}

/**
 * Calculate fair referral reward based on platform activity
 */
export async function calculateFairReferralReward(): Promise<number> {
  const avgActivity = await calculateFairAverage("posts", "week");
  
  // Base reward: 10 NOP
  // Scale down if platform is very active (prevent inflation)
  const baseReward = 10;
  const activityFactor = Math.min(avgActivity / 10, 1); // Normalize to 0-1
  const reward = baseReward * (1 - activityFactor * 0.3); // Reduce by up to 30%

  return Math.max(reward, 5); // Minimum 5 NOP
}

/**
 * Validate user action to prevent spam/inflation
 */
export async function validateUserAction(
  walletAddress: string,
  action: "post" | "trade" | "referral",
  value?: number
): Promise<{ allowed: boolean; reason?: string; normalizedValue?: number }> {
  if (!supabase) {
    return { allowed: true };
  }

  const normalized = walletAddress.toLowerCase().trim();

  try {
    // Get user's recent activity
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    let recentCount = 0;
    switch (action) {
      case "post":
        const { count: postCount } = await supabase
          .from("social_posts")
          .select("*", { count: "exact", head: true })
          .eq("wallet_address", normalized)
          .gte("created_at", oneDayAgo.toISOString());
        recentCount = postCount || 0;
        break;
      case "trade":
        const { count: tradeCount } = await supabase
          .from("pool_positions")
          .select("*", { count: "exact", head: true })
          .eq("wallet_address", normalized)
          .gte("created_at", oneDayAgo.toISOString());
        recentCount = tradeCount || 0;
        break;
      case "referral":
        const { count: refCount } = await supabase
          .from("referrals")
          .select("*", { count: "exact", head: true })
          .eq("referrer_address", normalized)
          .gte("created_at", oneDayAgo.toISOString());
        recentCount = refCount || 0;
        break;
    }

    // Fair limits (based on average user behavior)
    const FAIR_LIMITS = {
      post: 10, // Max 10 posts per day
      trade: 20, // Max 20 trades per day
      referral: 5, // Max 5 referrals per day
    };

    if (recentCount >= FAIR_LIMITS[action]) {
      return {
        allowed: false,
        reason: `Daily limit reached for ${action}. Please try again tomorrow.`,
      };
    }

    // Normalize value if provided
    let normalizedValue = value;
    if (value !== undefined) {
      if (action === "referral") {
        normalizedValue = await calculateFairReferralReward();
      } else if (action === "trade") {
        // Validate trade amount is reasonable (not too small/large)
        const avgVolume = await calculateFairAverage("volume", "week");
        if (value < avgVolume * 0.01) {
          return {
            allowed: false,
            reason: "Trade amount is too small",
          };
        }
        if (value > avgVolume * 10) {
          return {
            allowed: false,
            reason: "Trade amount exceeds fair limit",
          };
        }
      }
    }

    return {
      allowed: true,
      normalizedValue,
    };
  } catch (error) {
    console.error("[fairData] Error validating action", error);
    return { allowed: true }; // Fail open
  }
}

/**
 * Get fair distribution for rewards (prevents inflation)
 */
export function getFairRewardDistribution(
  totalRewards: number,
  recipients: number
): { perRecipient: number; remainder: number } {
  if (recipients === 0) {
    return { perRecipient: 0, remainder: totalRewards };
  }

  // Use fair division (avoid giving too much to few people)
  const maxPerRecipient = totalRewards / Math.max(recipients, 1);
  const perRecipient = Math.min(maxPerRecipient, totalRewards / recipients);

  // Distribute remainder fairly
  const remainder = totalRewards - perRecipient * recipients;

  return {
    perRecipient: Math.floor(perRecipient * 100) / 100, // Round to 2 decimals
    remainder: Math.floor(remainder * 100) / 100,
  };
}

/**
 * Calculate fair badge reward (scales with rarity)
 */
export function calculateBadgeReward(rarity: "common" | "rare" | "epic" | "legendary"): number {
  const RARITY_MULTIPLIERS = {
    common: 1,
    rare: 2,
    epic: 5,
    legendary: 10,
  };

  const baseReward = 5; // Base 5 NOP
  return baseReward * RARITY_MULTIPLIERS[rarity];
}

/**
 * Validate and cap metrics to prevent inflation
 */
export function capMetric(value: number, metric: "volume" | "count" | "reward"): number {
  const CAPS = {
    volume: 1_000_000, // Max 1M NOP volume per day
    count: 1000, // Max 1000 actions per day
    reward: 10_000, // Max 10K NOP reward per day
  };

  return Math.min(value, CAPS[metric]);
}

/**
 * Calculate moving average for fair value estimation
 */
export async function calculateMovingAverage(
  metric: "posts" | "trades" | "volume",
  days: number = 7
): Promise<number> {
  if (!supabase) {
    return 0;
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query;
    switch (metric) {
      case "posts":
        query = supabase
          .from("social_posts")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString());
        break;
      case "trades":
        query = supabase
          .from("pool_positions")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString());
        break;
      case "volume":
        query = supabase
          .from("pool_positions")
          .select("cost_basis")
          .gte("created_at", startDate.toISOString());
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error("[fairData] Error calculating moving average", error);
      return 0;
    }

    if (metric === "volume") {
      const values = (data as { cost_basis?: number }[]) || [];
      const sum = values.reduce((acc, item) => acc + Number(item.cost_basis || 0), 0);
      return sum / days;
    } else {
      const count = (data as { count?: number })?.count || 0;
      return count / days;
    }
  } catch (error) {
    console.error("[fairData] Error calculating moving average", error);
    return 0;
  }
}

