import { supabase } from "@/lib/supabaseClient";
import type { AlphaMetrics } from "./alpha";

export type AdminMetrics = {
  totalUsers: number;
  totalProfiles: number;
  totalPosts: number;
  totalContributes: number;
  totalPositions: number;
  alphaDistribution: Array<{
    bucket: string; // e.g. '0-29', '30-59', '60-84', '85-100'
    count: number;
  }>;
  topAlphaUsers: Array<{
    wallet_address: string;
    alpha_score: number;
    total_positions: number;
  }>;
};

/**
 * Fetches protocol-level metrics for the admin dashboard.
 */
export async function fetchAdminMetrics(): Promise<AdminMetrics | null> {
  const client = supabase;
  if (!client) {
    return null;
  }

  try {
    const [
      usersRes,
      profilesRes,
      postsRes,
      contributesRes,
      positionsRes,
      alphaRes,
    ] = await Promise.all([
      client.from("profiles").select("*", { count: "exact", head: true }),
      client.from("social_profiles").select("*", { count: "exact", head: true }),
      client.from("social_posts").select("*", { count: "exact", head: true }),
      client.from("social_posts").select("*", { count: "exact", head: true }), // Contributes are social_posts with pool_enabled
      client.from("onchain_positions").select("*", { count: "exact", head: true }),
      client
        .from("alpha_metrics")
        .select("wallet_address, alpha_score, total_positions")
        .order("alpha_score", { ascending: false })
        .limit(10),
    ]);

    const topAlphaUsers = (alphaRes.data ?? []).map((row) => ({
      wallet_address: row.wallet_address,
      alpha_score: Number(row.alpha_score ?? 0),
      total_positions: Number(row.total_positions ?? 0),
    }));

    // Calculate alpha distribution
    const allAlpha = await client
      .from("alpha_metrics")
      .select("alpha_score")
      .gt("alpha_score", 0);

    const distribution = [
      { bucket: "0-29", count: 0 },
      { bucket: "30-59", count: 0 },
      { bucket: "60-84", count: 0 },
      { bucket: "85-100", count: 0 },
    ];

    (allAlpha.data ?? []).forEach((row) => {
      const score = Number(row.alpha_score ?? 0);
      if (score >= 85) {
        distribution[3].count++;
      } else if (score >= 60) {
        distribution[2].count++;
      } else if (score >= 30) {
        distribution[1].count++;
      } else if (score > 0) {
        distribution[0].count++;
      }
    });

    return {
      totalUsers: usersRes.count ?? 0,
      totalProfiles: profilesRes.count ?? 0,
      totalPosts: postsRes.count ?? 0,
      totalContributes: postsRes.count ?? 0, // Simplified: all posts are potential contributes
      totalPositions: positionsRes.count ?? 0,
      alphaDistribution: distribution,
      topAlphaUsers,
    };
  } catch (error) {
    console.warn("[adminAnalytics] Failed to fetch metrics", error);
    return null;
  }
}

