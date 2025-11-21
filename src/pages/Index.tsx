import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { AIMarketBar } from "@/components/ai/AIMarketBar";
import { PostComposer } from "@/components/post/PostComposer";
import { FeedList } from "@/components/feed/FeedList";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { MarketMicroChart } from "@/components/market/MarketMicroChart";
import { PUBLIC_ENV } from "@/config/env";
import { IntelligenceFeed } from "@/components/intel/IntelligenceFeed";
import { TrendingUsers } from "@/components/widgets/TrendingUsers";
import CryptoNews from "@/components/CryptoNews";
import BoostedTasks from "@/components/BoostedTasks";
import TokenBurn from "@/components/TokenBurn";
import { Button } from "@/components/ui/button";
import { fetchPlatformMetrics, formatMetric } from "@/lib/metrics";

type PriceSignal = {
  symbol: string;
  price: number;
  change24h: number;
};

const API_BASE = PUBLIC_ENV.apiBase || "/api";

const buildSparkline = (price: number, change: number) => {
  const points = [];
  const segments = 12;
  const endPrice = price;
  const startPrice = change ? endPrice / (1 + change / 100) : endPrice * 0.985;

  for (let i = 0; i < segments; i += 1) {
    const progress = i / (segments - 1);
    const base = startPrice + (endPrice - startPrice) * progress;
    const noise = Math.sin(i * 1.2) * endPrice * 0.003;
    points.push({
      time: Date.now() - (segments - i) * 60 * 1000,
      value: Number((base + noise).toFixed(endPrice >= 100 ? 2 : 4)),
    });
  }

  return points;
};

const Index = () => {
  const { t } = useTranslation();
  const [signals, setSignals] = useState<PriceSignal[]>([]);
  const [loadingSignals, setLoadingSignals] = useState(false);

  const loadSignals = useCallback(async () => {
    setLoadingSignals(true);
    try {
      const response = await fetch(`${API_BASE}/prices`);
      if (!response.ok) {
        throw new Error(`prices_${response.status}`);
      }
      const payload = (await response.json()) as { items?: PriceSignal[] };
      setSignals(payload.items ?? []);
    } catch {
      setSignals([]);
    } finally {
      setLoadingSignals(false);
    }
  }, []);

  useEffect(() => {
    void loadSignals();
  }, [loadSignals]);

  const microCharts = useMemo(() => {
    return signals.slice(0, 3).map((entry) => ({
      symbol: entry.symbol,
      change: entry.change24h,
      data: buildSparkline(entry.price, entry.change24h),
    }));
  }, [signals]);

  const metricsQuery = useQuery({
    queryKey: ["platform-metrics"],
    queryFn: fetchPlatformMetrics,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  const metrics = metricsQuery.data;

  const heroSnapshot = useMemo(
    () => [
      { 
        label: t("home.totalUsers"), 
        value: metrics ? formatMetric(metrics.totalUsers) : (metricsQuery.isLoading ? "—" : "0")
      },
      { 
        label: t("home.activePositions"), 
        value: metrics ? formatMetric(metrics.activePositions) : (metricsQuery.isLoading ? "—" : "0")
      },
      { 
        label: t("home.reputationLeaders"), 
        value: metrics ? formatMetric(metrics.reputationLeaders) : (metricsQuery.isLoading ? "—" : "0")
      },
      { 
        label: t("home.burn7d"), 
        value: metrics ? `${formatMetric(metrics.burn7d)} NOP` : (metricsQuery.isLoading ? "—" : "0 NOP")
      },
    ],
    [metrics, metricsQuery.isLoading, t],
  );

  return (
      <div className="space-y-4 lg:space-y-6">
        <DashboardCard className="space-y-4">
          <DashboardSectionTitle label={t("home.overview")} title={t("home.title")} />
          <p className="text-sm-2 leading-relaxed text-text-secondary">
            {t("home.subtitle")}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            {heroSnapshot.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-left shadow-subtle/30 sm:rounded-[16px] sm:px-4 sm:py-3"
              >
                <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-text-muted sm:text-[10px]">{item.label}</p>
                <p className="text-xl font-semibold text-text-primary tabular-nums sm:text-2xl-2">{item.value}</p>
              </div>
            ))}
          </div>
        </DashboardCard>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.1fr)] lg:gap-6">
          <div className="space-y-4 lg:space-y-6">
            <DashboardCard className="space-y-4">
              <DashboardSectionTitle label={t("home.market")} title={t("home.marketContext")} />
              <AIMarketBar />
              <div className="grid gap-3 md:grid-cols-2">
                {microCharts.length > 0 && !loadingSignals
                  ? microCharts.map((chart) => (
                      <MarketMicroChart
                        key={chart.symbol}
                        symbol={chart.symbol}
                        changePct={chart.change}
                        data={chart.data}
                      />
                    ))
                  : Array.from({ length: 2 }).map((_, index) => (
                      <div
                        key={`sparkline-skeleton-${index}`}
                        className="h-28 rounded-card border border-border-subtle bg-surface-muted"
                      />
                    ))}
              </div>
            </DashboardCard>

            <DashboardCard className="space-y-3">
              <DashboardSectionTitle label={t("home.community")} title={t("home.shareIntelligence")} />
              <PostComposer />
            </DashboardCard>

            <DashboardCard className="space-y-3">
              <DashboardSectionTitle label={t("home.feed")} title={t("home.liveStream")} />
              <FeedList />
            </DashboardCard>

            <DashboardCard className="space-y-3 lg:hidden">
              <DashboardSectionTitle
                label={t("home.contribute")}
                title={t("home.discoverPools")}
                description={t("home.discoverDescription")}
              />
              <p className="text-sm-2 text-text-secondary">
                {t("home.startFromContributes")}
              </p>
              <Button asChild variant="accent" size="sm" className="w-full sm:w-auto">
                <Link to="/contributes">{t("home.goToContributes")}</Link>
              </Button>
            </DashboardCard>
          </div>
          <aside className="hidden space-y-4 lg:block">
            <IntelligenceFeed />
            <TrendingUsers limit={5} />
            <CryptoNews />
            <BoostedTasks />
            <div className="hidden xl:block">
              <TokenBurn />
            </div>
          </aside>
        </div>
    </div>
  );
};

export default Index;
