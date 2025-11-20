/**
 * Analytics & Metrics System
 * Tracks user performance, engagement, and platform metrics
 */

import { supabase } from "@/lib/supabaseClient";

export type UserAnalytics = {
  walletAddress: string;
  date: string;
  postsCount: number;
  commentsCount: number;
  likesCount: number;
  tradesCount: number;
  volumeNop: number;
  pnlTotal: number;
  followersGained: number;
};

export type AnalyticsPeriod = "day" | "week" | "month" | "all";

export type UserAnalyticsSummary = {
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalTrades: number;
  totalVolume: number;
  totalPnl: number;
  totalFollowers: number;
  averageDailyPosts: number;
  averageDailyVolume: number;
  winRate: number;
};

/**
 * Record daily analytics for a user
 */
export async function recordDailyAnalytics(walletAddress: string, date: Date = new Date()): Promise<void> {
  if (!supabase) {
    console.warn("[analytics] Supabase not configured");
    return;
  }

  const normalized = walletAddress.toLowerCase().trim();
  const dateStr = date.toISOString().split("T")[0];

  try {
    // Count posts
    const { count: postsCount } = await supabase
      .from("social_posts")
      .select("*", { count: "exact", head: true })
      .eq("wallet_address", normalized)
      .gte("created_at", new Date(date.setHours(0, 0, 0, 0)).toISOString())
      .lt("created_at", new Date(date.setHours(23, 59, 59, 999)).toISOString());

    // Count comments
    const { count: commentsCount } = await supabase
      .from("social_comments")
      .select("*", { count: "exact", head: true })
      .eq("wallet_address", normalized)
      .gte("created_at", new Date(date.setHours(0, 0, 0, 0)).toISOString())
      .lt("created_at", new Date(date.setHours(23, 59, 59, 999)).toISOString());

    // Count likes
    const { count: likesCount } = await supabase
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("wallet_address", normalized)
      .gte("created_at", new Date(date.setHours(0, 0, 0, 0)).toISOString())
      .lt("created_at", new Date(date.setHours(23, 59, 59, 999)).toISOString());

    // Count trades and calculate volume/PnL
    const { data: trades } = await supabase
      .from("pool_positions")
      .select("shares, cost_basis, realized_pnl, unrealized_pnl")
      .eq("wallet_address", normalized)
      .gte("created_at", new Date(date.setHours(0, 0, 0, 0)).toISOString())
      .lt("created_at", new Date(date.setHours(23, 59, 59, 999)).toISOString());

    const tradesCount = trades?.length || 0;
    const volumeNop = trades?.reduce((sum, t) => sum + Number(t.cost_basis || 0), 0) || 0;
    const pnlTotal = trades?.reduce((sum, t) => sum + Number(t.realized_pnl || 0) + Number(t.unrealized_pnl || 0), 0) || 0;

    // Count followers gained
    const { count: followersGained } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_address", normalized)
      .gte("created_at", new Date(date.setHours(0, 0, 0, 0)).toISOString())
      .lt("created_at", new Date(date.setHours(23, 59, 59, 999)).toISOString());

    // Upsert analytics
    await supabase
      .from("user_analytics")
      .upsert(
        {
          wallet_address: normalized,
          date: dateStr,
          posts_count: postsCount || 0,
          comments_count: commentsCount || 0,
          likes_count: likesCount || 0,
          trades_count: tradesCount,
          volume_nop: volumeNop,
          pnl_total: pnlTotal,
          followers_gained: followersGained || 0,
        },
        {
          onConflict: "wallet_address,date",
        }
      );
  } catch (error) {
    console.error("[analytics] Failed to record daily analytics", error);
  }
}

/**
 * Get analytics for a user
 */
export async function getUserAnalytics(
  walletAddress: string,
  period: AnalyticsPeriod = "week"
): Promise<UserAnalytics[]> {
  if (!supabase) {
    return [];
  }

  const normalized = walletAddress.toLowerCase().trim();
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
    default:
      startDate = new Date(0); // All time
  }

  const { data: analytics, error } = await supabase
    .from("user_analytics")
    .select("*")
    .eq("wallet_address", normalized)
    .gte("date", startDate.toISOString().split("T")[0])
    .order("date", { ascending: false });

  if (error) {
    console.error("[analytics] Failed to fetch analytics", error);
    return [];
  }

  return (
    analytics?.map((a) => ({
      walletAddress: a.wallet_address,
      date: a.date,
      postsCount: a.posts_count,
      commentsCount: a.comments_count,
      likesCount: a.likes_count,
      tradesCount: a.trades_count,
      volumeNop: Number(a.volume_nop),
      pnlTotal: Number(a.pnl_total),
      followersGained: a.followers_gained,
    })) || []
  );
}

/**
 * Get analytics summary for a user
 */
export async function getUserAnalyticsSummary(walletAddress: string): Promise<UserAnalyticsSummary> {
  if (!supabase) {
    return {
      totalPosts: 0,
      totalComments: 0,
      totalLikes: 0,
      totalTrades: 0,
      totalVolume: 0,
      totalPnl: 0,
      totalFollowers: 0,
      averageDailyPosts: 0,
      averageDailyVolume: 0,
      winRate: 0,
    };
  }

  const normalized = walletAddress.toLowerCase().trim();

  // Get all analytics
  const analytics = await getUserAnalytics(normalized, "all");

  // Calculate totals
  const totalPosts = analytics.reduce((sum, a) => sum + a.postsCount, 0);
  const totalComments = analytics.reduce((sum, a) => sum + a.commentsCount, 0);
  const totalLikes = analytics.reduce((sum, a) => sum + a.likesCount, 0);
  const totalTrades = analytics.reduce((sum, a) => sum + a.tradesCount, 0);
  const totalVolume = analytics.reduce((sum, a) => sum + a.volumeNop, 0);
  const totalPnl = analytics.reduce((sum, a) => sum + a.pnlTotal, 0);
  const totalFollowers = analytics.reduce((sum, a) => sum + a.followersGained, 0);

  // Calculate averages
  const days = analytics.length || 1;
  const averageDailyPosts = totalPosts / days;
  const averageDailyVolume = totalVolume / days;

  // Calculate win rate from closed positions
  const { data: closedPositions } = await supabase
    .from("pool_positions")
    .select("realized_pnl")
    .eq("wallet_address", normalized)
    .eq("status", "closed");

  const totalClosed = closedPositions?.length || 0;
  const winCount = closedPositions?.filter((p) => Number(p.realized_pnl || 0) > 0).length || 0;
  const winRate = totalClosed > 0 ? (winCount / totalClosed) * 100 : 0;

  return {
    totalPosts,
    totalComments,
    totalLikes,
    totalTrades,
    totalVolume,
    totalPnl,
    totalFollowers,
    averageDailyPosts,
    averageDailyVolume,
    winRate,
  };
}

/**
 * Get platform-wide analytics (admin only)
 */
export async function getPlatformAnalytics(period: AnalyticsPeriod = "week"): Promise<{
  totalUsers: number;
  totalPosts: number;
  totalTrades: number;
  totalVolume: number;
  activeUsers: number;
}> {
  if (!supabase) {
    return {
      totalUsers: 0,
      totalPosts: 0,
      totalTrades: 0,
      totalVolume: 0,
      activeUsers: 0,
    };
  }

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
    default:
      startDate = new Date(0);
  }

  const [usersRes, postsRes, tradesRes, volumeRes] = await Promise.all([
    supabase.from("social_profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("social_posts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString()),
    supabase
      .from("pool_positions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString()),
    supabase
      .from("pool_positions")
      .select("cost_basis")
      .gte("created_at", startDate.toISOString()),
  ]);

  const totalUsers = usersRes.count || 0;
  const totalPosts = postsRes.count || 0;
  const totalTrades = tradesRes.count || 0;
  const totalVolume = volumeRes.data?.reduce((sum, t) => sum + Number(t.cost_basis || 0), 0) || 0;

  // Active users (users who posted or traded in period)
  const { count: activeUsers } = await supabase
    .from("social_profiles")
    .select("*", { count: "exact", head: true })
    .in(
      "wallet_address",
      (
        await supabase
          .from("social_posts")
          .select("wallet_address")
          .gte("created_at", startDate.toISOString())
      ).data?.map((p) => p.wallet_address) || []
    );

  return {
    totalUsers,
    totalPosts,
    totalTrades,
    totalVolume,
    activeUsers: activeUsers || 0,
  };
}

