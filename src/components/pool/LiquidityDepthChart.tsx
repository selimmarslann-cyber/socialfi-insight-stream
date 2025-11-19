import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { formatTokenAmount } from "@/lib/format";
import { getBuyQuote, getSellQuote, initBondingCurve, type BondingCurveState } from "@/lib/bondingCurve";

type LiquidityDepthChartProps = {
  reserve: bigint;
  supply: bigint;
  className?: string;
};

export function LiquidityDepthChart({ reserve, supply, className }: LiquidityDepthChartProps) {
  const depthData = useMemo(() => {
    const state = initBondingCurve(reserve, supply);
    const steps = 10;
    const data: Array<{ price: bigint; buyAmount: bigint; sellAmount: bigint }> = [];

    for (let i = 0; i <= steps; i++) {
      const buyShares = (supply * BigInt(i)) / BigInt(steps);
      const sellShares = (supply * BigInt(i)) / BigInt(steps);

      const buyQuote = getBuyQuote(state, buyShares);
      const sellQuote = getSellQuote(state, sellShares);

      data.push({
        price: buyQuote.pricePerShare,
        buyAmount: buyQuote.cost,
        sellAmount: sellQuote.payout,
      });
    }

    return data;
  }, [reserve, supply]);

  const maxAmount = useMemo(() => {
    return Math.max(
      ...depthData.map((d) => Number(d.buyAmount)),
      ...depthData.map((d) => Number(d.sellAmount))
    );
  }, [depthData]);

  return (
    <Card className={`space-y-4 rounded-2xl border border-border-subtle bg-surface p-5 ${className || ""}`}>
      <div>
        <h3 className="text-sm font-semibold text-text-primary">Liquidity Depth</h3>
        <p className="text-xs text-text-secondary">Price impact visualization</p>
      </div>

      <div className="space-y-2">
        {/* Buy Side */}
        <div>
          <p className="mb-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Buy Side</p>
          <div className="flex h-32 items-end gap-1">
            {depthData.map((point, i) => {
              const height = maxAmount > 0 ? (Number(point.buyAmount) / maxAmount) * 100 : 0;
              return (
                <div
                  key={`buy-${i}`}
                  className="flex-1 rounded-t bg-emerald-500/60 transition-all hover:bg-emerald-500"
                  style={{ height: `${height}%` }}
                  title={`${formatTokenAmount(point.buyAmount)} NOP`}
                />
              );
            })}
          </div>
        </div>

        {/* Current Price */}
        <div className="flex items-center justify-center gap-2 border-t border-border-subtle pt-2">
          <div className="text-center">
            <p className="text-xs text-text-muted">Current Price</p>
            <p className="text-sm font-semibold text-text-primary">
              {depthData.length > 0 ? formatTokenAmount(depthData[Math.floor(depthData.length / 2)].price) : "—"} NOP
            </p>
          </div>
        </div>

        {/* Sell Side */}
        <div>
          <p className="mb-2 text-xs font-semibold text-red-600 dark:text-red-400">Sell Side</p>
          <div className="flex h-32 items-start gap-1">
            {depthData.map((point, i) => {
              const height = maxAmount > 0 ? (Number(point.sellAmount) / maxAmount) * 100 : 0;
              return (
                <div
                  key={`sell-${i}`}
                  className="flex-1 rounded-b bg-red-500/60 transition-all hover:bg-red-500"
                  style={{ height: `${height}%` }}
                  title={`${formatTokenAmount(point.sellAmount)} NOP`}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl border border-border-subtle bg-surface-muted/50 p-3 text-xs">
        <div>
          <p className="text-text-muted">Reserve</p>
          <p className="font-semibold text-text-primary">{formatTokenAmount(reserve)} NOP</p>
        </div>
        <div>
          <p className="text-text-muted">Supply</p>
          <p className="font-semibold text-text-primary">{formatTokenAmount(supply)} Shares</p>
        </div>
      </div>
    </Card>
  );
}

