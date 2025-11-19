import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { computeSocialPriceCorrelation } from "@/lib/correlation";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

type SocialPriceCorrelationCardProps = {
  windowDays?: number;
};

const chartConfig = {
  price: {
    label: "Price (normalized)",
    color: "hsl(var(--chart-1))",
  },
  activity: {
    label: "Social Activity",
    color: "hsl(var(--chart-2))",
  },
};

export function SocialPriceCorrelationCard({ windowDays = 7 }: SocialPriceCorrelationCardProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["social-price-correlation", windowDays],
    queryFn: () => computeSocialPriceCorrelation({ windowDays }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const correlation = data?.correlation ?? 0;
  const points = data?.points ?? [];

  // Format correlation value and label
  const correlationLabel =
    correlation > 0.3
      ? "pozitif korelasyon"
      : correlation < -0.3
        ? "negatif korelasyon"
        : "zayıf korelasyon";

  // Prepare chart data
  const chartData = points.map((point) => ({
    timestamp: new Date(point.timestamp).toLocaleDateString("tr-TR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
    }),
    price: point.priceUsd,
    activity: point.socialActivity,
  }));

  // Normalize for display (both on 0-1 scale)
  const maxPrice = Math.max(...chartData.map((d) => d.price), 1);
  const maxActivity = Math.max(...chartData.map((d) => d.activity), 1);
  const normalizedChartData = chartData.map((d) => ({
    ...d,
    priceNormalized: (d.price / maxPrice) * 100,
    activityNormalized: (d.activity / maxActivity) * 100,
  }));

  return (
    <Card className="rounded-3xl border border-border bg-card p-6 shadow-card-soft">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Social → Price Correlation</h2>
        <p className="text-sm text-text-secondary">
          Son {windowDays} gündeki sosyal aktivite & fiyat ilişkisi
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : error ? (
        <div className="rounded-2xl border border-error/20 bg-error/10 p-4 text-sm text-error">
          Veri yüklenirken bir hata oluştu.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Correlation</p>
            <p className="text-2xl font-semibold text-text-primary">
              ρ = {correlation.toFixed(2)} ({correlationLabel})
            </p>
          </div>

          {normalizedChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <LineChart data={normalizedChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="priceNormalized"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={false}
                  name="Price"
                />
                <Line
                  type="monotone"
                  dataKey="activityNormalized"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={false}
                  name="Social Activity"
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="rounded-2xl border border-border-subtle bg-card/70 p-8 text-center text-sm text-text-secondary">
              Yeterli veri bulunamadı.
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

