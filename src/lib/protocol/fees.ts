export interface FeeBreakdown {
  protocolFeeUsd: number;
  burnUsd: number;
  treasuryUsd: number;
  rewardsUsd: number;
}

/**
 * Estimate the protocol fee for a position notional.
 * Default rate: 1% (0.01). The same helper can be reused for close fees if needed.
 */
export function computeProtocolFee(positionNotionalUsd: number, rate = 0.01): FeeBreakdown {
  const safeNotional = Number.isFinite(positionNotionalUsd) ? Math.max(positionNotionalUsd, 0) : 0;
  const fee = safeNotional * rate;
  const burnUsd = fee * 0.5;
  const treasuryUsd = fee * 0.25;
  const rewardsUsd = fee * 0.25;
  return {
    protocolFeeUsd: fee,
    burnUsd,
    treasuryUsd,
    rewardsUsd,
  };
}
