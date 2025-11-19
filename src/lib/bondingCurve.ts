/**
 * Bonding Curve Implementation
 * Linear bonding curve: price = reserve / supply
 * 
 * Formula:
 * - Buy: cost = (reserve * shares) / (supply + shares)
 * - Sell: payout = (reserve * shares) / supply
 * 
 * This ensures:
 * - Early buyers get better prices
 * - Price increases as more people buy
 * - Fair price discovery
 */

export type BondingCurveState = {
  reserve: bigint; // Total NOP in pool
  supply: bigint; // Total shares issued
  virtualReserve: bigint; // Virtual reserve for price calculation
  virtualSupply: bigint; // Virtual supply for price calculation
};

export type PriceQuote = {
  cost: bigint; // Cost to buy shares
  shares: bigint; // Shares received
  pricePerShare: bigint; // Price per share
  impact: number; // Price impact percentage
};

export type SellQuote = {
  payout: bigint; // NOP received
  shares: bigint; // Shares to sell
  pricePerShare: bigint; // Price per share
  impact: number; // Price impact percentage
};

// Constants for bonding curve
const VIRTUAL_RESERVE = 1000n * 10n ** 18n; // 1000 NOP virtual reserve
const VIRTUAL_SUPPLY = 1000n * 10n ** 18n; // 1000 shares virtual supply

/**
 * Initialize bonding curve state
 */
export function initBondingCurve(reserve: bigint, supply: bigint): BondingCurveState {
  return {
    reserve,
    supply,
    virtualReserve: VIRTUAL_RESERVE,
    virtualSupply: VIRTUAL_SUPPLY,
  };
}

/**
 * Calculate price per share using linear bonding curve
 * price = (reserve + virtualReserve) / (supply + virtualSupply)
 */
export function getPricePerShare(state: BondingCurveState): bigint {
  const totalReserve = state.reserve + state.virtualReserve;
  const totalSupply = state.supply + state.virtualSupply;
  
  if (totalSupply === 0n) {
    return 10n ** 15n; // 0.001 NOP per share (minimum price)
  }
  
  return (totalReserve * 10n ** 18n) / totalSupply;
}

/**
 * Calculate buy quote (how much NOP needed to buy X shares)
 * Uses constant product formula: (reserve + amount) * (supply) = (reserve) * (supply + shares)
 */
export function getBuyQuote(
  state: BondingCurveState,
  shares: bigint
): PriceQuote {
  if (shares === 0n) {
    return {
      cost: 0n,
      shares: 0n,
      pricePerShare: 0n,
      impact: 0,
    };
  }

  const totalReserve = state.reserve + state.virtualReserve;
  const totalSupply = state.supply + state.virtualSupply;
  
  // Constant product: k = reserve * supply
  const k = totalReserve * totalSupply;
  
  // New supply after buy
  const newSupply = totalSupply + shares;
  
  // New reserve needed to maintain k
  const newReserve = k / newSupply;
  
  // Cost = newReserve - currentReserve
  const cost = newReserve > totalReserve ? newReserve - totalReserve : 0n;
  
  // Price per share
  const pricePerShare = cost > 0n ? (cost * 10n ** 18n) / shares : getPricePerShare(state);
  
  // Price impact
  const currentPrice = getPricePerShare(state);
  const newPrice = newReserve > 0n ? (newReserve * 10n ** 18n) / newSupply : currentPrice;
  const impact = currentPrice > 0n 
    ? Number((newPrice - currentPrice) * 10000n / currentPrice) / 100 
    : 0;

  return {
    cost,
    shares,
    pricePerShare,
    impact,
  };
}

/**
 * Calculate sell quote (how much NOP received for X shares)
 */
export function getSellQuote(
  state: BondingCurveState,
  shares: bigint
): SellQuote {
  if (shares === 0n || shares > state.supply) {
    return {
      payout: 0n,
      shares: 0n,
      pricePerShare: 0n,
      impact: 0,
    };
  }

  const totalReserve = state.reserve + state.virtualReserve;
  const totalSupply = state.supply + state.virtualSupply;
  
  // Constant product: k = reserve * supply
  const k = totalReserve * totalSupply;
  
  // New supply after sell
  const newSupply = totalSupply - shares;
  
  if (newSupply === 0n) {
    return {
      payout: 0n,
      shares: 0n,
      pricePerShare: 0n,
      impact: 0,
    };
  }
  
  // New reserve after maintaining k
  const newReserve = k / newSupply;
  
  // Payout = currentReserve - newReserve
  const payout = totalReserve > newReserve ? totalReserve - newReserve : 0n;
  
  // Price per share
  const pricePerShare = payout > 0n ? (payout * 10n ** 18n) / shares : getPricePerShare(state);
  
  // Price impact
  const currentPrice = getPricePerShare(state);
  const newPrice = newReserve > 0n ? (newReserve * 10n ** 18n) / newSupply : currentPrice;
  const impact = currentPrice > 0n 
    ? Number((currentPrice - newPrice) * 10000n / currentPrice) / 100 
    : 0;

  return {
    payout,
    shares,
    pricePerShare,
    impact,
  };
}

/**
 * Calculate shares received for a given NOP amount
 */
export function getSharesForAmount(
  state: BondingCurveState,
  amount: bigint
): bigint {
  if (amount === 0n) return 0n;
  
  const totalReserve = state.reserve + state.virtualReserve;
  const totalSupply = state.supply + state.virtualSupply;
  
  // Constant product: k = reserve * supply
  const k = totalReserve * totalSupply;
  
  // New reserve after buy
  const newReserve = totalReserve + amount;
  
  // New supply to maintain k
  const newSupply = k / newReserve;
  
  // Shares received
  const shares = newSupply > totalSupply ? newSupply - totalSupply : 0n;
  
  return shares;
}

/**
 * Format price for display
 */
export function formatPrice(price: bigint, decimals: number = 18): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = price / divisor;
  const fraction = price % divisor;
  const fractionStr = fraction.toString().padStart(decimals, "0");
  const trimmed = fractionStr.replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole.toString();
}

