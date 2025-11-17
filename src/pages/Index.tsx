import { useCallback, useEffect, useMemo, useState } from "react";
import { AIMarketBar } from "@/components/ai/AIMarketBar";
import { PostComposer } from "@/components/post/PostComposer";
import { FeedList } from "@/components/feed/FeedList";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { MarketMicroChart } from "@/components/market/MarketMicroChart";
import { PUBLIC_ENV } from "@/config/env";
import TopUsersCard from "@/components/TopUsersCard";
import { IntelligenceFeed } from "@/components/intel/IntelligenceFeed";

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

  return (
    <div className="space-y-5">
      <DashboardCard className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-500">NOP Intelligence Layer</p>
          <h1 className="text-2xl font-semibold text-slate-900">AI Market Scanner</h1>
          <p className="text-sm text-slate-500">Live intelligence spanning chains, wallets, and creators.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {microCharts.length > 0 && !loadingSignals
            ? microCharts.map((chart) => (
                <MarketMicroChart key={chart.symbol} symbol={chart.symbol} changePct={chart.change} data={chart.data} />
              ))
            : Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`sparkline-skeleton-${index}`}
                  className="h-28 rounded-2xl border border-slate-100 bg-slate-50/60"
                />
              ))}
        </div>
      </DashboardCard>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <AIMarketBar />
          <div className="space-y-4">
            <IntelligenceFeed />
            <TopUsersCard title="Top Operators" limit={5} />
          </div>
        </div>

      <section className="space-y-3">
        <DashboardSectionTitle label="Community" title="Share Intelligence" />
        <PostComposer />
      </section>

      <section className="space-y-3">
        <DashboardSectionTitle label="Feed" title="Live SocialFi Stream" />
        <FeedList />
      </section>
    </div>
  );
};

export default Index;
