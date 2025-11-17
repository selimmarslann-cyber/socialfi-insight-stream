import { BrowserProvider, JsonRpcProvider } from "ethers";
import { PROTOCOL_ENV } from "@/config/env";
import { getSupabase } from "@/lib/supabaseClient";
import type { Database } from "@/integrations/supabase/types";

export type SocialPosition = Database["public"]["Tables"]["social_positions"]["Row"];

const isBrowser = typeof window !== "undefined";

const getRpcProvider = () => {
  if (isBrowser && typeof (window as { ethereum?: unknown }).ethereum !== "undefined") {
    return new BrowserProvider((window as { ethereum?: unknown }).ethereum, "any");
  }
  if (PROTOCOL_ENV.l2RpcUrl) {
    return new JsonRpcProvider(PROTOCOL_ENV.l2RpcUrl);
  }
  return null;
};

export interface TradeTxInfo {
  hash: string;
  from: string;
  to?: string;
  timestamp: number;
  chainId?: number;
}

export async function fetchTradeTxInfo(txHash: string): Promise<TradeTxInfo | null> {
  const provider = getRpcProvider();
  if (!provider) {
    console.warn("[protocol] No RPC provider available for tx verification");
    return null;
  }

  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      return null;
    }
    const block = tx.blockNumber ? await provider.getBlock(tx.blockNumber) : null;
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to ?? undefined,
      timestamp: block?.timestamp ? block.timestamp * 1000 : Date.now(),
      chainId: typeof tx.chainId === "bigint" ? Number(tx.chainId) : (tx as { chainId?: number }).chainId,
    };
  } catch (error) {
    console.error("[protocol] Failed to fetch tx info", error);
    return null;
  }
}

const missingSupabase = { ok: false as const, error: "Supabase is not configured." };

export async function openSocialPosition(params: {
  userAddress: string;
  contributeId?: string;
  direction: "long" | "short";
  sizeNop: number;
  entryPriceUsd?: number;
  txHashOpen: string;
  chainId?: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return missingSupabase;
  }

  const txInfo = await fetchTradeTxInfo(params.txHashOpen);
  if (!txInfo) {
    return { ok: false, error: "Unable to verify on-chain transaction." };
  }

  if (txInfo.from.toLowerCase() !== params.userAddress.toLowerCase()) {
    return { ok: false, error: "Transaction sender does not match wallet address." };
  }

  const { error } = await supabase.from("social_positions").insert({
    user_address: params.userAddress,
    contribute_id: params.contributeId ?? null,
    direction: params.direction,
    size_nop: params.sizeNop,
    entry_price_usd: params.entryPriceUsd ?? null,
    status: "open",
    tx_hash_open: params.txHashOpen,
    chain_id: params.chainId ?? txInfo.chainId ?? null,
  });

  if (error) {
    console.error("[protocol] Failed to insert social position", error);
    return { ok: false, error: "Database error saving position." };
  }

  return { ok: true };
}

export async function closeSocialPosition(params: {
  positionId: string;
  exitPriceUsd: number;
  txHashClose?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return missingSupabase;
  }

  const { data, error } = await supabase
    .from("social_positions")
    .select("*")
    .eq("id", params.positionId)
    .maybeSingle<SocialPosition>();

  if (error || !data) {
    return { ok: false, error: "Position not found." };
  }

  const entryPrice = typeof data.entry_price_usd === "number" ? data.entry_price_usd : params.exitPriceUsd;
  const sizeNop = typeof data.size_nop === "number" ? data.size_nop : Number(data.size_nop ?? 0);
  const pnl = (params.exitPriceUsd - entryPrice) * sizeNop;

  const { error: updateError } = await supabase
    .from("social_positions")
    .update({
      exit_price_usd: params.exitPriceUsd,
      realized_pnl_usd: pnl,
      closed_at: new Date().toISOString(),
      status: "closed",
      tx_hash_close: params.txHashClose ?? null,
    })
    .eq("id", params.positionId);

  if (updateError) {
    console.error("[protocol] Failed to close social position", updateError);
    return { ok: false, error: "Database error closing position." };
  }

  return { ok: true };
}

export async function fetchUserSocialPositions(userAddress: string): Promise<SocialPosition[]> {
  const supabase = getSupabase();
  if (!supabase || !userAddress) {
    return [];
  }

  const { data, error } = await supabase
    .from("social_positions")
    .select("*")
    .eq("user_address", userAddress)
    .order("opened_at", { ascending: false });

  if (error) {
    console.warn("[protocol] Failed to fetch user social positions", error);
    return [];
  }

  return data ?? [];
}
