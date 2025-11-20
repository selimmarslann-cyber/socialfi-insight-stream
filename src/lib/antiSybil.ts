/**
 * Anti-Sybil System
 * Detects and prevents multiple account abuse, rate limiting, and suspicious activity
 */

import { supabase } from "@/lib/supabaseClient";

export type SybilCheckResult = {
  isSuspicious: boolean;
  riskScore: number; // 0-100, higher = more suspicious
  reasons: string[];
  action: "allow" | "warn" | "block" | "rate_limit";
};

export type RateLimitCheck = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  reason?: string;
};

const MAX_ACTIONS_PER_HOUR = 20;
const MAX_ACTIONS_PER_DAY = 100;
const MAX_POSTS_PER_HOUR = 5;
const MAX_POSTS_PER_DAY = 20;
const MAX_WALLETS_PER_IP = 3;
const SUSPICIOUS_RISK_THRESHOLD = 70;

/**
 * Check if a wallet address is suspicious (multiple accounts, bot behavior, etc.)
 */
export async function checkSybilRisk(walletAddress: string, ipAddress?: string): Promise<SybilCheckResult> {
  if (!supabase) {
    return {
      isSuspicious: false,
      riskScore: 0,
      reasons: [],
      action: "allow",
    };
  }

  const normalizedWallet = walletAddress.toLowerCase().trim();
  const reasons: string[] = [];
  let riskScore = 0;

  try {
    // Check 1: Multiple wallets from same IP
    if (ipAddress) {
      const { data: ipWallets, error: ipError } = await supabase
        .from("social_profiles")
        .select("wallet_address, created_at")
        .eq("ip_address", ipAddress)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!ipError && ipWallets && ipWallets.length >= MAX_WALLETS_PER_IP) {
        riskScore += 30;
        reasons.push(`Multiple wallets from same IP (${ipWallets.length})`);
      }
    }

    // Check 2: Recently created accounts with high activity
    const { data: profile, error: profileError } = await supabase
      .from("social_profiles")
      .select("created_at, wallet_address")
      .eq("wallet_address", normalizedWallet)
      .single();

    if (!profileError && profile) {
      const accountAge = Date.now() - new Date(profile.created_at).getTime();
      const accountAgeHours = accountAge / (1000 * 60 * 60);

      // Check activity in first hour
      if (accountAgeHours < 1) {
        const { count: postCount } = await supabase
          .from("social_posts")
          .select("*", { count: "exact", head: true })
          .eq("wallet_address", normalizedWallet);

        if (postCount && postCount > 3) {
          riskScore += 25;
          reasons.push("High activity immediately after account creation");
        }
      }
    }

    // Check 3: Similar wallet addresses (potential bot generation)
    const { data: similarWallets, error: similarError } = await supabase
      .from("social_profiles")
      .select("wallet_address, created_at")
      .like("wallet_address", normalizedWallet.slice(0, 10) + "%")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!similarError && similarWallets && similarWallets.length >= 3) {
      riskScore += 20;
      reasons.push("Multiple similar wallet addresses detected");
    }

    // Check 4: Zero balance or new wallet
    // This is informational, not necessarily suspicious
    if (normalizedWallet.startsWith("0x0000") || normalizedWallet.length < 42) {
      riskScore += 15;
      reasons.push("Invalid or suspicious wallet format");
    }

    // Check 5: Rapid sequential actions
    const { data: recentActions, error: actionsError } = await supabase
      .from("social_posts")
      .select("created_at")
      .eq("wallet_address", normalizedWallet)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!actionsError && recentActions && recentActions.length >= 5) {
      const timeDiff = new Date(recentActions[0].created_at).getTime() - new Date(recentActions[4].created_at).getTime();
      const minutesDiff = timeDiff / (1000 * 60);

      if (minutesDiff < 5) {
        riskScore += 25;
        reasons.push("Rapid sequential actions detected");
      }
    }

    // Determine action
    let action: SybilCheckResult["action"] = "allow";
    if (riskScore >= SUSPICIOUS_RISK_THRESHOLD) {
      action = "block";
    } else if (riskScore >= 50) {
      action = "warn";
    } else if (riskScore >= 30) {
      action = "rate_limit";
    }

    return {
      isSuspicious: riskScore >= SUSPICIOUS_RISK_THRESHOLD,
      riskScore,
      reasons,
      action,
    };
  } catch (error) {
    console.error("[antiSybil] Error checking sybil risk", error);
    // Fail open - allow if check fails
    return {
      isSuspicious: false,
      riskScore: 0,
      reasons: [],
      action: "allow",
    };
  }
}

/**
 * Check rate limits for a wallet address
 */
export async function checkRateLimit(
  walletAddress: string,
  actionType: "post" | "comment" | "like" | "trade" | "general"
): Promise<RateLimitCheck> {
  if (!supabase) {
    return {
      allowed: true,
      remaining: 999,
      resetAt: new Date(Date.now() + 3600000),
    };
  }

  const normalizedWallet = walletAddress.toLowerCase().trim();
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    let query;
    let maxPerHour: number;
    let maxPerDay: number;

    switch (actionType) {
      case "post":
        query = supabase.from("social_posts");
        maxPerHour = MAX_POSTS_PER_HOUR;
        maxPerDay = MAX_POSTS_PER_DAY;
        break;
      case "comment":
        query = supabase.from("social_comments");
        maxPerHour = MAX_ACTIONS_PER_HOUR;
        maxPerDay = MAX_ACTIONS_PER_DAY;
        break;
      case "like":
        query = supabase.from("post_likes");
        maxPerHour = MAX_ACTIONS_PER_HOUR;
        maxPerDay = MAX_ACTIONS_PER_DAY;
        break;
      case "trade":
        query = supabase.from("pool_positions");
        maxPerHour = MAX_ACTIONS_PER_HOUR;
        maxPerDay = MAX_ACTIONS_PER_DAY;
        break;
      default:
        query = supabase.from("social_posts");
        maxPerHour = MAX_ACTIONS_PER_HOUR;
        maxPerDay = MAX_ACTIONS_PER_DAY;
    }

    // Check hourly limit
    const { count: hourlyCount, error: hourlyError } = await query
      .select("*", { count: "exact", head: true })
      .eq("wallet_address", normalizedWallet)
      .gte("created_at", oneHourAgo.toISOString());

    if (hourlyError) {
      console.error("[antiSybil] Error checking hourly rate limit", hourlyError);
      return {
        allowed: true,
        remaining: maxPerHour,
        resetAt: new Date(now.getTime() + 3600000),
      };
    }

    const hourlyRemaining = Math.max(0, maxPerHour - (hourlyCount || 0));

    if (hourlyCount && hourlyCount >= maxPerHour) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(now.getTime() + 3600000),
        reason: `Hourly limit reached (${maxPerHour} ${actionType}s/hour)`,
      };
    }

    // Check daily limit
    const { count: dailyCount, error: dailyError } = await query
      .select("*", { count: "exact", head: true })
      .eq("wallet_address", normalizedWallet)
      .gte("created_at", oneDayAgo.toISOString());

    if (dailyError) {
      console.error("[antiSybil] Error checking daily rate limit", dailyError);
      return {
        allowed: hourlyRemaining > 0,
        remaining: hourlyRemaining,
        resetAt: new Date(now.getTime() + 3600000),
      };
    }

    const dailyRemaining = Math.max(0, maxPerDay - (dailyCount || 0));

    if (dailyCount && dailyCount >= maxPerDay) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        reason: `Daily limit reached (${maxPerDay} ${actionType}s/day)`,
      };
    }

    return {
      allowed: true,
      remaining: Math.min(hourlyRemaining, dailyRemaining),
      resetAt: new Date(now.getTime() + 3600000),
    };
  } catch (error) {
    console.error("[antiSybil] Error checking rate limit", error);
    // Fail open
    return {
      allowed: true,
      remaining: 999,
      resetAt: new Date(now.getTime() + 3600000),
    };
  }
}

/**
 * Record an action for rate limiting and sybil detection
 */
export async function recordAction(
  walletAddress: string,
  actionType: "post" | "comment" | "like" | "trade" | "general",
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!supabase) return;

  try {
    // Store in a rate limit tracking table (if exists)
    // For now, we rely on existing tables (social_posts, etc.)
    // This function can be extended to log to a dedicated rate_limit_logs table
    console.log("[antiSybil] Action recorded", { walletAddress, actionType, metadata });
  } catch (error) {
    console.error("[antiSybil] Error recording action", error);
  }
}

/**
 * Get IP address from request (for server-side use)
 */
export function getClientIP(request?: Request): string | undefined {
  if (typeof window === "undefined" || !request) {
    return undefined;
  }

  // Try various headers
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return undefined;
}

