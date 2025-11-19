import { supabase } from "@/lib/supabaseClient";

export type AlphaLabel = "Rookie" | "Intermediate" | "Pro" | "Elite";

export type AlphaMetrics = {
  wallet_address: string;
  total_positions: number;
  closed_positions: number;
  wins: number;
  losses: number;
  avg_roi: number | null;
  best_roi: number | null;
  worst_roi: number | null;
  alpha_score: number;
  last_updated_at: string;
};

/**
 * Gets the Alpha label based on the score.
 * 0-30: Rookie
 * 30-60: Intermediate
 * 60-85: Pro
 * 85-100: Elite
 */
export function getAlphaLabel(score: number): AlphaLabel {
  if (score >= 85) return "Elite";
  if (score >= 60) return "Pro";
  if (score >= 30) return "Intermediate";
  return "Rookie";
}

/**
 * Normalizes ROI value to a reasonable range and handles nulls.
 */
function normalizeRoi(value: number | null): number {
  if (value === null || !Number.isFinite(value)) return 0;
  return Math.max(-1000, Math.min(1000, value));
}

/**
 * Computes Alpha Score from position data.
 *
 * Formula (Phase 3 version):
 * - base = 50 * winRate
 * - roiComponent = 50 * clamp(avgRoi / 100, -1, 1)  // -50 to +50
 * - stability = Math.log(closedPositions + 1) * 2    // small bonus
 * - score = clamp(base + roiComponent + stability, 0, 100)
 *
 * @param positions Array of position data from onchain_positions
 * @returns Computed alpha score (0-100)
 */
function computeAlphaScore(positions: Array<{
  side: string;
  closed_at: string | null;
  roi: number | null;
}>): number {
  if (positions.length === 0) return 0;

  // For now, treat any row with a non-null roi as "closed"
  const closed = positions.filter((p) => p.roi !== null);
  const closedPositions = closed.length;

  if (closedPositions === 0) {
    // No closed positions yet - give a small base score based on activity
    return Math.min(10, Math.log10(positions.length + 1) * 5);
  }

  // Calculate win rate (positions with positive ROI are wins)
  const wins = closed.filter((p) => normalizeRoi(p.roi) > 0).length;
  const losses = closed.filter((p) => normalizeRoi(p.roi) <= 0).length;
  const winRate = closedPositions > 0 ? wins / closedPositions : 0;

  // Calculate average ROI
  const rois = closed.map((p) => normalizeRoi(p.roi));
  const avgRoi = rois.length > 0 ? rois.reduce((sum, r) => sum + r, 0) / rois.length : 0;

  // Base score: 50% win rate
  const base = 50 * winRate;

  // ROI component: 50 * clamp(avgRoi / 100, -1, 1)  // -50 to +50
  const roiComponent = 50 * Math.max(-1, Math.min(1, avgRoi / 100));

  // Stability adjustment: rewards more closed positions
  const stability = Math.log(closedPositions + 1) * 2;

  // Final score clamped to 0-100
  return Math.max(0, Math.min(100, base + roiComponent + stability));
}

/**
 * Recomputes alpha metrics for a wallet address.
 * Reads all positions from onchain_positions, computes metrics, and upserts into alpha_metrics.
 *
 * This function should be called:
 * - When a profile page is viewed (lazy recompute)
 * - Periodically via cron/edge function (future)
 */
export async function recomputeAlphaForWallet(walletAddress: string): Promise<AlphaMetrics | null> {
  const client = supabase;
  if (!client) {
    console.warn("[alpha] Supabase client unavailable");
    return null;
  }

  const normalizedWallet = walletAddress.toLowerCase();

  // Fetch all positions for this wallet
  const { data: positions, error: positionsError } = await client
    .from("onchain_positions")
    .select("side, closed_at, roi, pnl")
    .eq("wallet_address", normalizedWallet);

  if (positionsError) {
    console.warn("[alpha] Failed to fetch positions", positionsError);
    return null;
  }

  const allPositions = positions ?? [];
  const totalPositions = allPositions.length;
  
  // For now, treat any row with a non-null roi as "closed"
  const closedWithRoi = allPositions.filter((p) => p.roi !== null);
  const closedPositions = closedWithRoi.length;

  // Calculate wins/losses from closed positions with ROI
  const wins = closedWithRoi.filter((p) => normalizeRoi(p.roi) > 0).length;
  const losses = closedWithRoi.filter((p) => normalizeRoi(p.roi) <= 0).length;

  // Calculate ROI stats
  const rois = closedWithRoi.map((p) => normalizeRoi(p.roi));
  const avgRoi = rois.length > 0 ? rois.reduce((sum, r) => sum + r, 0) / rois.length : null;
  const bestRoi = rois.length > 0 ? Math.max(...rois) : null;
  const worstRoi = rois.length > 0 ? Math.min(...rois) : null;

  // Compute alpha score
  const alphaScore = computeAlphaScore(allPositions);

  // Upsert into alpha_metrics
  const metrics: Omit<AlphaMetrics, "last_updated_at"> & { last_updated_at: string } = {
    wallet_address: normalizedWallet,
    total_positions: totalPositions,
    closed_positions: closedPositions,
    wins,
    losses,
    avg_roi: avgRoi,
    best_roi: bestRoi,
    worst_roi: worstRoi,
    alpha_score: alphaScore,
    last_updated_at: new Date().toISOString(),
  };

  const { data, error: upsertError } = await client
    .from("alpha_metrics")
    .upsert(metrics, {
      onConflict: "wallet_address",
    })
    .select()
    .single();

  if (upsertError) {
    console.warn("[alpha] Failed to upsert alpha metrics", upsertError);
    return null;
  }

  return data as AlphaMetrics;
}

/**
 * Fetches alpha metrics for a wallet address.
 * If metrics don't exist or are stale, triggers a recompute.
 */
export async function getAlphaMetrics(
  walletAddress: string,
  options?: { forceRecompute?: boolean },
): Promise<AlphaMetrics | null> {
  const client = supabase;
  if (!client) {
    return null;
  }

  const normalizedWallet = walletAddress.toLowerCase();

  if (options?.forceRecompute) {
    return recomputeAlphaForWallet(walletAddress);
  }

  // Try to fetch existing metrics
  const { data, error } = await client
    .from("alpha_metrics")
    .select("*")
    .eq("wallet_address", normalizedWallet)
    .single();

  if (error || !data) {
    // No metrics found, recompute
    return recomputeAlphaForWallet(walletAddress);
  }

  // Check if metrics are stale (older than 1 hour)
  const lastUpdated = new Date(data.last_updated_at);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (lastUpdated < oneHourAgo) {
    // Stale, recompute in background (don't await)
    void recomputeAlphaForWallet(walletAddress);
  }

  return data as AlphaMetrics;
}

/**
 * Fetches top alpha users by score.
 */
export async function getTopAlphaUsers(limit: number = 10): Promise<AlphaMetrics[]> {
  const client = supabase;
  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("alpha_metrics")
    .select("*")
    .order("alpha_score", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.warn("[alpha] Failed to fetch top alpha users", error);
    return [];
  }

  return data as AlphaMetrics[];
}

