const SCALE = 10_000n;

export const applyMultiplier = (amount: bigint, multiplier: number): bigint => {
  if (amount === 0n) return 0n;
  const scaledMultiplier = BigInt(Math.round(multiplier * Number(SCALE)));
  return (amount * scaledMultiplier) / SCALE;
};

export const applyBps = (amount: bigint, bps: number): bigint => {
  if (amount === 0n) return 0n;
  return (amount * BigInt(bps)) / SCALE;
};
