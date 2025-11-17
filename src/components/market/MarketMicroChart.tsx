import * as React from "react";
import { Area, AreaChart } from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

type MarketPoint = {
  time: string | number;
  value: number;
};

type MarketMicroChartProps = {
  symbol: string;
  data: MarketPoint[];
  changePct?: number;
  className?: string;
};

export function MarketMicroChart({ symbol, data, changePct = 0, className }: MarketMicroChartProps) {
  const latest = data.at(-1)?.value ?? 0;
  const trendPositive = changePct >= 0;
  const gradientId = React.useId();
  const chartConfig = React.useMemo<ChartConfig>(
    () => ({
      trend: {
        label: symbol,
        color: trendPositive ? "var(--color-success)" : "var(--color-danger)",
      },
    }),
    [symbol, trendPositive],
  );

  const formattedPrice = latest.toLocaleString("en-US", {
    minimumFractionDigits: latest >= 100 ? 0 : 2,
    maximumFractionDigits: latest >= 100 ? 0 : 4,
  });

  const formattedChange = `${trendPositive ? "+" : ""}${changePct.toFixed(2)}%`;

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/60 bg-white p-4 shadow-card-soft dark:border-white/10 dark:bg-[var(--color-surface-elevated)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {symbol}
          </div>
          <div className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
            {formattedPrice}
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
            trendPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600",
          )}
        >
          {formattedChange}
        </span>
      </div>

      <ChartContainer
        className="mt-2 h-16 w-full [&_.recharts-surface]:overflow-visible"
        config={chartConfig}
      >
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`${gradientId}-trend`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="5%"
                stopColor={trendPositive ? "rgba(16, 185, 129, 0.4)" : "rgba(248, 113, 113, 0.4)"}
              />
              <stop
                offset="95%"
                stopColor={trendPositive ? "rgba(16, 185, 129, 0.05)" : "rgba(248, 113, 113, 0.05)"}
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={trendPositive ? "#10B981" : "#F87171"}
            strokeWidth={2}
            fill={`url(#${gradientId}-trend)`}
            fillOpacity={0.4}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
