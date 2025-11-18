import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/lib/supabaseClient";

export type TradeSide = "buy" | "sell";

export type TradeLogInput = {
  walletAddress: string;
  postId: number;
  side: TradeSide;
  amountNop: bigint;
  txHash: string;
  chainId?: number;
};

export type AlphaUser = {
  walletAddress: string;
  trades: number;
  volumeNop: number;
  netVolumeNop: number;
  score: number;
};

export type AlphaQueryOptions = {
  limit?: number;
  withinDays?: number;
};

const SEPOLIA_CHAIN_ID = 11155111;

export async function logTrade(input: TradeLogInput) {
  const client = supabase;
  if (!client) {
    console.warn("[reputation] Supabase client unavailable, skipping trade log.");
    return;
  }

  const { walletAddress, postId, side, amountNop, txHash, chainId } = input;
  const amountFloat = Number(amountNop) / 1e18;

  const { error } = await client.from("nop_trades").insert({
    wallet_address: walletAddress.toLowerCase(),
    post_id: postId,
    side,
    amount_nop: amountFloat,
    tx_hash: txHash,
    chain_id: chainId ?? SEPOLIA_CHAIN_ID,
  });

  if (error) {
    console.warn("[reputation] Failed to log trade to nop_trades", error);
  }
}

type TradeRow = Pick<
  Tables<"nop_trades">,
  "wallet_address" | "side" | "amount_nop" | "executed_at"
>;

export async function fetchTopAlphaUsers(
  options: AlphaQueryOptions = {},
): Promise<AlphaUser[]> {
  const client = supabase;
  if (!client) {
    return [];
  }

  const limit = options.limit ?? 10;
  const withinDays = options.withinDays ?? 7;

  const since = new Date();
  since.setDate(since.getDate() - withinDays);

  const { data, error } = await client
    .from("nop_trades")
    .select("wallet_address, side, amount_nop, executed_at")
    .gte("executed_at", since.toISOString());

  if (error || !data) {
    console.warn("[reputation] Failed to fetch trades for alpha calculation", error);
    return [];
  }

  const statsByWallet = new Map<
    string,
    { trades: number; volume: number; netVolume: number }
  >();

  for (const row of data as TradeRow[]) {
    const addr = (row.wallet_address ?? "").toLowerCase();
    if (!addr) continue;
    const amount = Number(row.amount_nop ?? 0);
    const side = row.side as TradeSide;

    if (!statsByWallet.has(addr)) {
      statsByWallet.set(addr, { trades: 0, volume: 0, netVolume: 0 });
    }

    const stats = statsByWallet.get(addr)!;
    stats.trades += 1;
    stats.volume += amount;
    stats.netVolume += side === "buy" ? amount : -amount;
  }

  const users: AlphaUser[] = Array.from(statsByWallet.entries()).map(
    ([walletAddress, s]) => {
      const netBias =
        s.netVolume >= 0
          ? Math.log10(1 + Math.abs(s.netVolume))
          : -Math.log10(1 + Math.abs(s.netVolume));
      const score = s.trades * 1 + Math.log10(1 + s.volume) * 2 + netBias;

      return {
        walletAddress,
        trades: s.trades,
        volumeNop: s.volume,
        netVolumeNop: s.netVolume,
        score,
      };
    },
  );

  users.sort((a, b) => b.score - a.score);

  return users.slice(0, limit);
}
