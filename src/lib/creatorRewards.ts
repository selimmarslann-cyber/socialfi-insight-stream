import { supabase } from "@/lib/supabaseClient";

export type CreatorEarnings = {
  walletAddress: string;
  totalEarnings: number;
  pendingEarnings: number;
  withdrawnEarnings: number;
  contributeCount: number;
  totalVolume: number;
  lastUpdatedAt: string;
};

const CREATOR_REWARD_BPS = 40; // 40% of fee (1% * 40% = 0.4% of transaction)

/**
 * Calculate creator reward from a buy transaction
 */
export function calculateCreatorReward(buyAmount: number): number {
  return (buyAmount * CREATOR_REWARD_BPS) / 10000;
}

/**
 * Record creator earnings from a buy transaction
 */
export async function recordCreatorEarnings(params: {
  creatorWallet: string;
  contributeId: string;
  buyAmount: number;
  txHash: string;
}): Promise<void> {
  const client = supabase;
  if (!client) {
    console.warn("[creatorRewards] Supabase client unavailable");
    return;
  }

  const reward = calculateCreatorReward(params.buyAmount);

  try {
    // Upsert creator earnings
    const { error: earningsError } = await client
      .from("creator_earnings")
      .upsert(
        {
          wallet_address: params.creatorWallet.toLowerCase(),
          contribute_id: params.contributeId,
          amount: reward,
          tx_hash: params.txHash,
          status: "pending",
          created_at: new Date().toISOString(),
        },
        {
          onConflict: "wallet_address,contribute_id,tx_hash",
        }
      );

    if (earningsError) {
      console.warn("[creatorRewards] Failed to record earnings", earningsError);
    }
  } catch (error) {
    console.warn("[creatorRewards] Error recording earnings", error);
  }
}

/**
 * Get creator earnings summary
 */
export async function getCreatorEarnings(walletAddress: string): Promise<CreatorEarnings | null> {
  const client = supabase;
  if (!client) {
    return null;
  }

  const normalizedWallet = walletAddress.toLowerCase();

  try {
    // Get all earnings for this creator
    const { data: earnings, error } = await client
      .from("creator_earnings")
      .select("*")
      .eq("wallet_address", normalizedWallet);

    if (error || !earnings) {
      console.warn("[creatorRewards] Failed to fetch earnings", error);
      return null;
    }

    const totalEarnings = earnings.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const pendingEarnings = earnings
      .filter((e) => e.status === "pending")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const withdrawnEarnings = earnings
      .filter((e) => e.status === "withdrawn")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Get contribute count
    const { data: contributes } = await client
      .from("contributes")
      .select("id")
      .eq("author", normalizedWallet);

    // Get total volume
    const { data: trades } = await client
      .from("nop_trades")
      .select("amount_nop")
      .eq("post_id", "contributes.contract_post_id")
      .in("post_id", contributes?.map((c) => c.id) || []);

    const totalVolume = trades?.reduce((sum, t) => sum + Number(t.amount_nop || 0), 0) || 0;

    return {
      walletAddress: normalizedWallet,
      totalEarnings,
      pendingEarnings,
      withdrawnEarnings,
      contributeCount: contributes?.length || 0,
      totalVolume,
      lastUpdatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn("[creatorRewards] Error fetching earnings", error);
    return null;
  }
}

/**
 * Withdraw creator earnings
 */
export async function withdrawCreatorEarnings(walletAddress: string, amount: number): Promise<boolean> {
  const client = supabase;
  if (!client) {
    return false;
  }

  const normalizedWallet = walletAddress.toLowerCase();

  try {
    // Mark earnings as withdrawn
    const { error } = await client
      .from("creator_earnings")
      .update({ status: "withdrawn", withdrawn_at: new Date().toISOString() })
      .eq("wallet_address", normalizedWallet)
      .eq("status", "pending")
      .lte("amount", amount);

    if (error) {
      console.warn("[creatorRewards] Failed to withdraw earnings", error);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[creatorRewards] Error withdrawing earnings", error);
    return false;
  }
}

