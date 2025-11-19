import { supabase } from "@/lib/supabaseClient";
import { getUserShares } from "@/lib/pool";
import { getPreviewSell, getPreviewBuyCost } from "@/lib/pool";
import { fetchContributesWithStats } from "@/lib/contributes";
import type { Contribute } from "./types";

export type PortfolioPosition = {
  contributeId: string;
  contributeTitle: string;
  postId: number;
  shares: bigint;
  costBasis: bigint; // Total NOP invested
  currentValue: bigint; // Current value if sold now
  unrealizedPnL: bigint; // currentValue - costBasis
  unrealizedPnLPercent: number;
  entryDate: string;
  status: "open" | "closed";
};

export type PortfolioSummary = {
  totalPositions: number;
  openPositions: number;
  totalInvested: bigint;
  totalValue: bigint;
  totalPnL: bigint;
  totalPnLPercent: number;
  realizedPnL: bigint;
  unrealizedPnL: bigint;
  winRate: number;
  bestPosition: PortfolioPosition | null;
  worstPosition: PortfolioPosition | null;
};

/**
 * Fetch all user positions across all contributes
 */
export async function fetchUserPortfolio(
  walletAddress: string
): Promise<PortfolioPosition[]> {
  if (!walletAddress) return [];

  const client = supabase;
  if (!client) return [];

  try {
    // Get all contributes
    const contributes = await fetchContributesWithStats();
    
    // Filter active contributes
    const activeContributes = contributes.filter(
      (c) => c.contractPostId && c.poolEnabled && Number.isFinite(Number(c.contractPostId))
    );

    // Batch fetch user shares (parallel execution)
    const sharesPromises = activeContributes.map(async (contribute) => {
      const postId = Number(contribute.contractPostId!);
      try {
        const shares = await getUserShares(walletAddress, String(postId));
        return { contribute, postId, shares };
      } catch (error) {
        console.warn(`[portfolio] Failed to fetch shares for post ${postId}`, error);
        return { contribute, postId, shares: 0n };
      }
    });

    const sharesResults = await Promise.all(sharesPromises);
    
    // Get user shares for each contribute
    const positions: PortfolioPosition[] = [];

    for (const { contribute, postId, shares } of sharesResults) {
      if (shares === 0n) continue;

        // Get cost basis (from trades) - parallel execution
        const [tradesResult, sellPreview] = await Promise.all([
          client
            .from("nop_trades")
            .select("amount_nop, side, executed_at")
            .eq("post_id", postId)
            .eq("wallet_address", walletAddress.toLowerCase())
            .eq("side", "buy")
            .order("executed_at", { ascending: true }),
          getPreviewSell(String(postId), shares),
        ]);

        const costBasis = tradesResult.data?.reduce((sum, trade) => {
          return sum + BigInt(Math.round(Number(trade.amount_nop || 0) * 1e18));
        }, 0n) || 0n;

        const currentValue = sellPreview.net || 0n;

        const unrealizedPnL = currentValue > costBasis 
          ? currentValue - costBasis 
          : costBasis - currentValue;
        
        const unrealizedPnLPercent = costBasis > 0n
          ? Number((unrealizedPnL * 10000n) / costBasis) / 100
          : 0;

        // Get entry date (first buy)
        const entryDate = tradesResult.data && tradesResult.data.length > 0 
          ? tradesResult.data[0].executed_at 
          : new Date().toISOString();

        positions.push({
          contributeId: contribute.id,
          contributeTitle: contribute.title,
          postId,
          shares,
          costBasis,
          currentValue,
          unrealizedPnL,
          unrealizedPnLPercent,
          entryDate,
          status: "open",
        });
      } catch (error) {
        console.warn(`[portfolio] Failed to fetch position for post ${postId}`, error);
      }
    }

    return positions;
  } catch (error) {
    console.error("[portfolio] Failed to fetch portfolio", error);
    return [];
  }
}

/**
 * Calculate portfolio summary
 */
export async function calculatePortfolioSummary(
  walletAddress: string
): Promise<PortfolioSummary> {
  const positions = await fetchUserPortfolio(walletAddress);

  if (positions.length === 0) {
    return {
      totalPositions: 0,
      openPositions: 0,
      totalInvested: 0n,
      totalValue: 0n,
      totalPnL: 0n,
      totalPnLPercent: 0,
      realizedPnL: 0n,
      unrealizedPnL: 0n,
      winRate: 0,
      bestPosition: null,
      worstPosition: null,
    };
  }

  const totalInvested = positions.reduce((sum, p) => sum + p.costBasis, 0n);
  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0n);
  const totalPnL = totalValue > totalInvested 
    ? totalValue - totalInvested 
    : totalInvested - totalValue;
  const totalPnLPercent = totalInvested > 0n
    ? Number((totalPnL * 10000n) / totalInvested) / 100
    : 0;

  const unrealizedPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL, 0n);
  
  // Calculate realized PnL from closed social positions
  let realizedPnL = 0n;
  try {
    const { fetchUserSocialPositions } = await import("@/lib/protocol/positions");
    const socialPositions = await fetchUserSocialPositions(walletAddress);
    
    // Sum realized PnL from closed positions
    const closedPositions = socialPositions.filter(p => p.status === "closed" && p.realized_pnl_usd !== null);
    realizedPnL = closedPositions.reduce((sum, p) => {
      const pnl = typeof p.realized_pnl_usd === "number" ? p.realized_pnl_usd : 0;
      // Convert USD to NOP (assuming 1:1 for now, or use price oracle)
      return sum + BigInt(Math.round(pnl * 1e18));
    }, 0n);
  } catch (error) {
    console.warn("[portfolio] Failed to fetch realized PnL from social positions", error);
  }
  
  // Win rate (positions with positive PnL - both realized and unrealized)
  const winningPositions = positions.filter(p => p.unrealizedPnL > 0n).length;
  const winRate = positions.length > 0 ? (winningPositions / positions.length) * 100 : 0;

  // Best and worst positions
  const bestPosition = positions.reduce((best, current) => {
    if (!best) return current;
    return current.unrealizedPnL > best.unrealizedPnL ? current : best;
  }, null as PortfolioPosition | null);

  const worstPosition = positions.reduce((worst, current) => {
    if (!worst) return current;
    return current.unrealizedPnL < worst.unrealizedPnL ? current : worst;
  }, null as PortfolioPosition | null);

  return {
    totalPositions: positions.length,
    openPositions: positions.filter(p => p.status === "open").length,
    totalInvested,
    totalValue,
    totalPnL,
    totalPnLPercent,
    realizedPnL,
    unrealizedPnL,
    winRate,
    bestPosition,
    worstPosition,
  };
}

/**
 * Format portfolio value for display
 */
export function formatPortfolioValue(value: bigint): string {
  const num = Number(value) / 1e18;
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M NOP`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K NOP`;
  }
  return `${num.toFixed(2)} NOP`;
}

