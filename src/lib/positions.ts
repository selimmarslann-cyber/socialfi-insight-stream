import { supabase } from "@/lib/supabaseClient";
import { getPoolAddress } from "@/lib/pool";

export type PositionSide = "BUY" | "SELL";

export type LogBuyPositionInput = {
  wallet: string;
  contributeId?: string | null;
  poolAddress?: string;
  amount: bigint | number;
  txHash: string;
};

export type LogSellPositionInput = {
  wallet: string;
  contributeId?: string | null;
  poolAddress?: string;
  amount: bigint | number;
  txHash: string;
};

/**
 * Logs a BUY position to onchain_positions table.
 * Amount should be in wei (18 decimals) for NOP tokens.
 */
export async function logBuyPosition(input: LogBuyPositionInput): Promise<void> {
  const client = supabase;
  if (!client) {
    console.warn("[positions] Supabase client unavailable, skipping position log.");
    return;
  }

  const { wallet, contributeId, poolAddress, amount, txHash } = input;
  const amountFloat = typeof amount === "bigint" ? Number(amount) / 1e18 : Number(amount);
  const poolAddr = poolAddress ?? getPoolAddress();

  const { error } = await client.from("onchain_positions").insert({
    wallet_address: wallet.toLowerCase(),
    contribute_id: contributeId ?? null,
    pool_address: poolAddr.toLowerCase(),
    side: "BUY",
    amount: amountFloat,
    tx_hash: txHash,
    opened_at: new Date().toISOString(),
  });

  if (error) {
    console.warn("[positions] Failed to log BUY position", error);
  }
}

/**
 * Logs a SELL position to onchain_positions table.
 * Amount should be in wei (18 decimals) for NOP tokens.
 */
export async function logSellPosition(input: LogSellPositionInput): Promise<void> {
  const client = supabase;
  if (!client) {
    console.warn("[positions] Supabase client unavailable, skipping position log.");
    return;
  }

  const { wallet, contributeId, poolAddress, amount, txHash } = input;
  const amountFloat = typeof amount === "bigint" ? Number(amount) / 1e18 : Number(amount);
  const poolAddr = poolAddress ?? getPoolAddress();

  const { error } = await client.from("onchain_positions").insert({
    wallet_address: wallet.toLowerCase(),
    contribute_id: contributeId ?? null,
    pool_address: poolAddr.toLowerCase(),
    side: "SELL",
    amount: amountFloat,
    tx_hash: txHash,
    opened_at: new Date().toISOString(),
  });

  if (error) {
    console.warn("[positions] Failed to log SELL position", error);
  }
}

