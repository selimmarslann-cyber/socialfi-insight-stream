import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";

type ReputationEntry = {
  user_address: string;
  realized_pnl_usd: number;
  win_rate: number | null;
};

type PositionEntry = {
  id: string;
  direction: "long" | "short";
  size_nop: number;
  status: "open" | "closed" | "liquidated";
};

type NewsEntry = {
  id: string;
  title: string;
  url: string;
  provider: string;
  published_at: string | null;
};

type DexScreenerPair = {
  priceUsd?: number | string;
  priceChange?: { h24?: number | string };
  volume?: { h24?: number | string };
};

type DexScreenerPayload = {
  pairs?: DexScreenerPair[];
} | null;

interface IntelligenceFeedData {
  topReputation: ReputationEntry[];
  recentPositions: PositionEntry[];
  news: NewsEntry[];
  nopMarket: DexScreenerPayload;
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  signDisplay: "always",
});

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export function IntelligenceFeed() {
  const { data, isLoading, isError } = useQuery<IntelligenceFeedData>({
    queryKey: ["intelligence-feed"],
    queryFn: async () => {
      const response = await fetch("/api/intelligence-feed");
      if (!response.ok) {
        throw new Error("Failed to load intelligence feed");
      }
      return (await response.json()) as IntelligenceFeedData;
    },
    staleTime: 60_000,
  });

  const pairMetrics = useMemo(() => {
    const firstPair = data?.nopMarket?.pairs?.[0];
    if (!firstPair) return null;
    const price = toNumber(firstPair.priceUsd);
    const change = toNumber(firstPair.priceChange?.h24);
    const volume = toNumber(firstPair.volume?.h24);
    return {
      price,
      change,
      volume,
    };
  }, [data?.nopMarket]);

  return (
    <DashboardCard className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <DashboardSectionTitle label="NOP Intelligence" title="Signal Snapshot" />
        <Link to="/explore" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
          View more →
        </Link>
      </div>

      {isLoading && <div className="text-xs text-slate-500">Loading intelligence…</div>}
      {isError && <div className="text-xs text-red-500">Failed to load intelligence feed.</div>}

      {data && !isLoading && !isError ? (
        <div className="space-y-4 text-xs text-slate-600">
          <section className="space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              NOP Market
            </div>
            {pairMetrics ? (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Price</p>
                  <p className="text-sm font-semibold text-slate-900">{pairMetrics.price ? usd.format(pairMetrics.price) : "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">24h</p>
                  <p
                    className={`text-sm font-semibold ${
                      (pairMetrics.change ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {pairMetrics.change !== null ? percent.format(pairMetrics.change) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Volume</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {pairMetrics.volume !== null ? `${compactNumber.format(pairMetrics.volume)} USD` : "—"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">Market data unavailable.</p>
            )}
          </section>

          <section className="space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Top Reputation
            </div>
            <div className="space-y-1.5">
              {data.topReputation.length === 0 ? (
                <p className="text-[11px] text-slate-500">No reputation scores yet.</p>
              ) : (
                data.topReputation.map((entry) => (
                  <div key={entry.user_address} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-700">
                        {entry.user_address.slice(2, 4).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-900">
                          {entry.user_address.slice(0, 6)}…{entry.user_address.slice(-4)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Win rate {(entry.win_rate ?? 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-semibold ${
                        entry.realized_pnl_usd >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {usd.format(entry.realized_pnl_usd)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Recent Positions
            </div>
            <div className="space-y-1.5">
              {data.recentPositions.length === 0 ? (
                <p className="text-[11px] text-slate-500">No positions have been registered.</p>
              ) : (
                data.recentPositions.map((position) => (
                  <div key={position.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          position.direction === "long"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {position.direction.toUpperCase()}
                      </span>
                      <span className="text-[11px] text-slate-700">
                        {Number(position.size_nop ?? 0).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}{" "}
                        NOP
                      </span>
                    </div>
                    <span className="text-[11px] capitalize text-slate-500">{position.status}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {data.news.length > 0 ? (
            <section className="space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                News Pulse
              </div>
              <div className="space-y-1.5">
                {data.news.slice(0, 3).map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2 transition hover:border-slate-200 hover:bg-white"
                  >
                    <p className="text-[11px] font-semibold text-slate-900">{item.title}</p>
                    <p className="text-[10px] text-slate-500">
                      {item.provider} · {item.published_at ? new Date(item.published_at).toLocaleDateString() : "recent"}
                    </p>
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </DashboardCard>
  );
}
