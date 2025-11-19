/**
 * Fair Fee Distribution System
 * 
 * Total Fee: 1% of transaction
 * Distribution:
 * - 40% Creator (contribute owner)
 * - 30% Liquidity Providers (people who hold shares)
 * - 20% Protocol Treasury (operations, burns)
 * - 10% Early Buyers Bonus (first 10 buyers get extra)
 * 
 * Everyone wins: Creator, LPs, Protocol, Early Supporters
 */

export type FeeDistribution = {
  totalFee: bigint;
  creatorShare: bigint; // 40%
  liquidityProviderShare: bigint; // 30%
  treasuryShare: bigint; // 20%
  earlyBuyerBonus: bigint; // 10%
};

export type FeeBreakdown = {
  totalFee: bigint;
  creatorShare: bigint;
  creatorSharePercent: number;
  lpShare: bigint;
  lpSharePercent: number;
  treasuryShare: bigint;
  treasurySharePercent: number;
  earlyBuyerBonus: bigint;
  earlyBuyerBonusPercent: number;
  netAmount: bigint; // Amount after fee
};

const FEE_BPS = 100; // 1% = 100 basis points
const CREATOR_BPS = 40; // 40% of fee
const LP_BPS = 30; // 30% of fee
const TREASURY_BPS = 20; // 20% of fee
const EARLY_BONUS_BPS = 10; // 10% of fee

const EARLY_BUYER_THRESHOLD = 10; // First 10 buyers get bonus

/**
 * Calculate fair fee distribution
 */
export function calculateFairFeeDistribution(
  amount: bigint,
  isBuy: boolean = true,
  buyerCount: number = 0
): FeeBreakdown {
  // Total fee: 1% of amount
  const totalFee = (amount * BigInt(FEE_BPS)) / 10000n;
  
  // Net amount after fee
  const netAmount = amount - totalFee;
  
  // Distribution
  const creatorShare = (totalFee * BigInt(CREATOR_BPS)) / 100n;
  const lpShare = (totalFee * BigInt(LP_BPS)) / 100n;
  const treasuryShare = (totalFee * BigInt(TREASURY_BPS)) / 100n;
  
  // Early buyer bonus (only for first 10 buyers)
  const isEarlyBuyer = isBuy && buyerCount < EARLY_BUYER_THRESHOLD;
  const earlyBuyerBonus = isEarlyBuyer 
    ? (totalFee * BigInt(EARLY_BONUS_BPS)) / 100n
    : 0n;
  
  // If not early buyer, bonus goes to treasury
  const adjustedTreasuryShare = isEarlyBuyer 
    ? treasuryShare 
    : treasuryShare + earlyBuyerBonus;

  return {
    totalFee,
    creatorShare,
    creatorSharePercent: CREATOR_BPS,
    lpShare,
    lpSharePercent: LP_BPS,
    treasuryShare: adjustedTreasuryShare,
    treasurySharePercent: isEarlyBuyer ? TREASURY_BPS : TREASURY_BPS + EARLY_BONUS_BPS,
    earlyBuyerBonus,
    earlyBuyerBonusPercent: isEarlyBuyer ? EARLY_BONUS_BPS : 0,
    netAmount,
  };
}

/**
 * Distribute fees to liquidity providers (proportional to their share)
 */
export function calculateLPShare(
  userShares: bigint,
  totalShares: bigint,
  lpPool: bigint
): bigint {
  if (totalShares === 0n || userShares === 0n) {
    return 0n;
  }
  
  // Proportional share: (userShares / totalShares) * lpPool
  return (userShares * lpPool) / totalShares;
}

/**
 * Get fee distribution summary for display
 */
export function getFeeDistributionSummary(breakdown: FeeBreakdown) {
  return {
    total: breakdown.totalFee,
    creator: {
      amount: breakdown.creatorShare,
      percent: breakdown.creatorSharePercent,
      label: "Creator Reward",
      description: "Goes to contribute owner",
    },
    liquidity: {
      amount: breakdown.lpShare,
      percent: breakdown.lpSharePercent,
      label: "Liquidity Provider",
      description: "Distributed to share holders",
    },
    treasury: {
      amount: breakdown.treasuryShare,
      percent: breakdown.treasurySharePercent,
      label: "Protocol Treasury",
      description: "Operations & burns",
    },
    earlyBonus: breakdown.earlyBuyerBonus > 0n ? {
      amount: breakdown.earlyBuyerBonus,
      percent: breakdown.earlyBuyerBonusPercent,
      label: "Early Buyer Bonus",
      description: "Reward for early supporters",
    } : null,
  };
}

