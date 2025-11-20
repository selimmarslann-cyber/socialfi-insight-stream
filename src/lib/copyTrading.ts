/**
 * Copy Trading System
 * Allows users to automatically copy trades from other traders
 */

import { supabase } from "@/lib/supabaseClient";
import { buyShares, sellShares } from "@/lib/pool";

export type CopyTrade = {
  id: string;
  copierAddress: string;
  copiedAddress: string;
  maxAmountPerTrade?: number;
  autoSell: boolean;
  active: boolean;
  createdAt: string;
};

export type CopyTradeStats = {
  totalCopied: number;
  totalProfit: number;
  winRate: number;
  activeCopies: number;
};

/**
 * Enable copy trading for a trader
 */
export async function enableCopyTrading(
  copierAddress: string,
  copiedAddress: string,
  options?: {
    maxAmountPerTrade?: number;
    autoSell?: boolean;
  }
): Promise<CopyTrade> {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }

  const normalizedCopier = copierAddress.toLowerCase().trim();
  const normalizedCopied = copiedAddress.toLowerCase().trim();

  if (normalizedCopier === normalizedCopied) {
    throw new Error("Cannot copy yourself");
  }

  // Check if already exists
  const { data: existing } = await supabase
    .from("copy_trades")
    .select("id")
    .eq("copier_address", normalizedCopier)
    .eq("copied_address", normalizedCopied)
    .single();

  if (existing) {
    // Update existing
    const { data: updated, error } = await supabase
      .from("copy_trades")
      .update({
        max_amount_per_trade: options?.maxAmountPerTrade,
        auto_sell: options?.autoSell ?? false,
        active: true,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw error;

    return {
      id: updated.id,
      copierAddress: updated.copier_address,
      copiedAddress: updated.copied_address,
      maxAmountPerTrade: updated.max_amount_per_trade ? Number(updated.max_amount_per_trade) : undefined,
      autoSell: updated.auto_sell,
      active: updated.active,
      createdAt: updated.created_at,
    };
  }

  // Create new
  const { data: copyTrade, error } = await supabase
    .from("copy_trades")
    .insert({
      copier_address: normalizedCopier,
      copied_address: normalizedCopied,
      max_amount_per_trade: options?.maxAmountPerTrade,
      auto_sell: options?.autoSell ?? false,
      active: true,
    })
    .select("*")
    .single();

  if (error) throw error;

  return {
    id: copyTrade.id,
    copierAddress: copyTrade.copier_address,
    copiedAddress: copyTrade.copied_address,
    maxAmountPerTrade: copyTrade.max_amount_per_trade ? Number(copyTrade.max_amount_per_trade) : undefined,
    autoSell: copyTrade.auto_sell,
    active: copyTrade.active,
    createdAt: copyTrade.created_at,
  };
}

/**
 * Disable copy trading
 */
export async function disableCopyTrading(copierAddress: string, copiedAddress: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }

  const normalizedCopier = copierAddress.toLowerCase().trim();
  const normalizedCopied = copiedAddress.toLowerCase().trim();

  const { error } = await supabase
    .from("copy_trades")
    .update({ active: false })
    .eq("copier_address", normalizedCopier)
    .eq("copied_address", normalizedCopied);

  if (error) throw error;
}

/**
 * Get all copy trades for a copier
 */
export async function getCopyTrades(copierAddress: string): Promise<CopyTrade[]> {
  if (!supabase) {
    return [];
  }

  const normalized = copierAddress.toLowerCase().trim();

  const { data: copyTrades, error } = await supabase
    .from("copy_trades")
    .select("*")
    .eq("copier_address", normalized)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[copyTrading] Failed to fetch copy trades", error);
    return [];
  }

  return (
    copyTrades?.map((ct) => ({
      id: ct.id,
      copierAddress: ct.copier_address,
      copiedAddress: ct.copied_address,
      maxAmountPerTrade: ct.max_amount_per_trade ? Number(ct.max_amount_per_trade) : undefined,
      autoSell: ct.auto_sell,
      active: ct.active,
      createdAt: ct.created_at,
    })) || []
  );
}

/**
 * Get all traders being copied by an address
 */
export async function getCopiedTraders(copierAddress: string): Promise<string[]> {
  const copyTrades = await getCopyTrades(copierAddress);
  return copyTrades.filter((ct) => ct.active).map((ct) => ct.copiedAddress);
}

/**
 * Execute copy trade when copied trader opens a position
 * This would typically be called by a backend service/webhook
 */
export async function executeCopyTrade(
  copiedAddress: string,
  contributeId: string,
  contractPostId: number,
  amount: bigint
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }

  const normalizedCopied = copiedAddress.toLowerCase().trim();

  // Find all active copy trades for this trader
  const { data: copyTrades, error } = await supabase
    .from("copy_trades")
    .select("*")
    .eq("copied_address", normalizedCopied)
    .eq("active", true);

  if (error || !copyTrades || copyTrades.length === 0) {
    return; // No one is copying this trader
  }

  // Execute copy trades for each copier
  for (const copyTrade of copyTrades) {
    try {
      const copierAddress = copyTrade.copier_address;
      let copyAmount = amount;

      // Apply max amount limit if set
      if (copyTrade.max_amount_per_trade) {
        const maxAmount = BigInt(Math.floor(Number(copyTrade.max_amount_per_trade) * 1e18));
        copyAmount = copyAmount > maxAmount ? maxAmount : copyAmount;
      }

      // Execute buy for copier
      await buyShares(contractPostId, copyAmount.toString(), copierAddress);

      // Log the copy trade execution
      console.log("[copyTrading] Executed copy trade", {
        copier: copierAddress,
        copied: copiedAddress,
        amount: copyAmount.toString(),
        contributeId,
      });
    } catch (error) {
      console.error("[copyTrading] Failed to execute copy trade", error);
      // Continue with other copy trades even if one fails
    }
  }
}

/**
 * Get copy trading stats
 */
export async function getCopyTradeStats(copierAddress: string): Promise<CopyTradeStats> {
  if (!supabase) {
    return {
      totalCopied: 0,
      totalProfit: 0,
      winRate: 0,
      activeCopies: 0,
    };
  }

  const normalized = copierAddress.toLowerCase().trim();

  // Get active copy trades count
  const { count: activeCopies } = await supabase
    .from("copy_trades")
    .select("*", { count: "exact", head: true })
    .eq("copier_address", normalized)
    .eq("active", true);

  // Get positions that were copied (this is a simplified version)
  // In a real implementation, you'd track which positions were copied
  const { data: positions } = await supabase
    .from("pool_positions")
    .select("realized_pnl, status")
    .eq("wallet_address", normalized)
    .eq("status", "closed");

  const totalCopied = positions?.length || 0;
  const totalProfit = positions?.reduce((sum, p) => sum + Number(p.realized_pnl || 0), 0) || 0;
  const winCount = positions?.filter((p) => Number(p.realized_pnl || 0) > 0).length || 0;
  const winRate = totalCopied > 0 ? (winCount / totalCopied) * 100 : 0;

  return {
    totalCopied,
    totalProfit,
    winRate,
    activeCopies: activeCopies || 0,
  };
}

