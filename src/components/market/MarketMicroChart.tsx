import * as React from "react";
import { Area, AreaChart } from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { StatusPill } from "@/components/ui/status-pill";
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
    <div className={cn("rounded-card border border-border-subtle bg-surface p-4 shadow-subtle", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">{symbol}</div>
          <div className="text-lg-2 font-semibold text-text-primary tabular-nums">{formattedPrice}</div>
        </div>
        <StatusPill tone={trendPositive ? "success" : "danger"} className="text-xs font-semibold">
          {formattedChange}
        </StatusPill>
      </div>

        <ChartContainer className="mt-2 h-16 w-full [&_.recharts-surface]:overflow-visible" config={chartConfig}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`${gradientId}-trend`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop
                  offset="5%"
                  stopColor={trendPositive ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.35)"}
                />
                <stop
                  offset="95%"
                  stopColor={trendPositive ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)"}
                />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={trendPositive ? "var(--color-success)" : "var(--color-error)"}
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
