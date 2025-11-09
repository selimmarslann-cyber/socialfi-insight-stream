import { formatUnits } from "ethers";

export const formatTokenAmount = (amount: bigint, decimals = 18, fractionDigits = 4) => {
  const numeric = Number.parseFloat(formatUnits(amount, decimals));
  if (Number.isNaN(numeric)) return "0";
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  });
};

export const formatBigint = (amount: bigint) => amount.toString();
