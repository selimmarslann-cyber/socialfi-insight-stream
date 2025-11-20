/**
 * Analytics Recording Cron Job
 * Runs daily to record analytics for all active users
 * Schedule: Daily at 00:00 UTC
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).json({});
  }

  // Verify cron secret (optional but recommended)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error: "Supabase configuration missing",
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = today.toISOString().split("T")[0];

    // Get all active users (users who have posted or traded in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: activeUsers, error: usersError } = await supabase
      .from("social_profiles")
      .select("wallet_address")
      .or(
        `created_at.gte.${thirtyDaysAgo.toISOString()},updated_at.gte.${thirtyDaysAgo.toISOString()}`
      )
      .limit(1000); // Process in batches

    if (usersError) {
      throw usersError;
    }

    if (!activeUsers || activeUsers.length === 0) {
      return res.status(200).json({ message: "No active users to process", processed: 0 });
    }

    let processed = 0;
    const errors: string[] = [];

    // Process each user
    for (const user of activeUsers) {
      if (!user.wallet_address) continue;

      try {
        const walletAddress = user.wallet_address.toLowerCase().trim();

        // Count posts
        const { count: postsCount } = await supabase
          .from("social_posts")
          .select("*", { count: "exact", head: true })
          .eq("wallet_address", walletAddress)
          .gte("created_at", today.toISOString())
          .lt("created_at", new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

        // Count comments
        const { count: commentsCount } = await supabase
          .from("social_comments")
          .select("*", { count: "exact", head: true })
          .eq("wallet_address", walletAddress)
          .gte("created_at", today.toISOString())
          .lt("created_at", new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

        // Count likes
        const { count: likesCount } = await supabase
          .from("post_likes")
          .select("*", { count: "exact", head: true })
          .eq("wallet_address", walletAddress)
          .gte("created_at", today.toISOString())
          .lt("created_at", new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

        // Get trades and calculate volume/PnL
        const { data: trades } = await supabase
          .from("pool_positions")
          .select("cost_basis, realized_pnl, unrealized_pnl")
          .eq("wallet_address", walletAddress)
          .gte("created_at", today.toISOString())
          .lt("created_at", new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

        const tradesCount = trades?.length || 0;
        const volumeNop = trades?.reduce((sum, t) => sum + Number(t.cost_basis || 0), 0) || 0;
        const pnlTotal =
          trades?.reduce(
            (sum, t) => sum + Number(t.realized_pnl || 0) + Number(t.unrealized_pnl || 0),
            0
          ) || 0;

        // Count followers gained
        const { count: followersGained } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_address", walletAddress)
          .gte("created_at", today.toISOString())
          .lt("created_at", new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

        // Upsert analytics
        const { error: upsertError } = await supabase
          .from("user_analytics")
          .upsert(
            {
              wallet_address: walletAddress,
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

        if (upsertError) {
          errors.push(`Failed to upsert analytics for ${walletAddress}: ${upsertError.message}`);
        } else {
          processed++;
        }
      } catch (error) {
        errors.push(`Error processing ${user.wallet_address}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    return res.status(200).json({
      message: "Analytics recording completed",
      processed,
      total: activeUsers.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit error output
    });
  } catch (error) {
    console.error("[cron/record-analytics] Error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}

