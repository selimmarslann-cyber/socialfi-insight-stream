import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { Button } from "@/components/ui/button";

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
        <DashboardSectionTitle
          label="NOP Intelligence"
          title="Signal snapshot"
          action={
            <Button asChild variant="outline" size="xs">
              <Link to="/explore">Explore</Link>
            </Button>
          }
        />

        {isLoading && <div className="text-xs-2 text-text-muted">Loading intelligence…</div>}
        {isError && <div className="text-xs-2 text-error">Failed to load intelligence feed.</div>}

        {data && !isLoading && !isError ? (
          <div className="space-y-4 text-xs-2 text-text-secondary">
            <section className="space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">NOP Market</div>
              {pairMetrics ? (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Price</p>
                    <p className="text-sm-2 font-semibold text-text-primary">
                      {pairMetrics.price ? usd.format(pairMetrics.price) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">24h</p>
                    <p
                      className={`text-sm-2 font-semibold ${
                        (pairMetrics.change ?? 0) >= 0 ? "text-success" : "text-error"
                      }`}
                    >
                      {pairMetrics.change !== null ? percent.format(pairMetrics.change) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Volume</p>
                    <p className="text-sm-2 font-semibold text-text-primary">
                      {pairMetrics.volume !== null ? `${compactNumber.format(pairMetrics.volume)} USD` : "—"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs-2 text-text-muted">Market data unavailable.</p>
              )}
            </section>

            <section className="space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">Top reputation</div>
              <div className="space-y-1.5">
                {data.topReputation.length === 0 ? (
                  <p className="text-xs-2 text-text-muted">No reputation scores yet.</p>
                ) : (
                  data.topReputation.map((entry) => (
                    <div key={entry.user_address} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-[10px] font-semibold text-text-primary">
                          {entry.user_address.slice(2, 4).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs-2 font-semibold text-text-primary">
                            {entry.user_address.slice(0, 6)}…{entry.user_address.slice(-4)}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            Win rate {(entry.win_rate ?? 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-semibold ${
                          entry.realized_pnl_usd >= 0 ? "text-success" : "text-error"
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
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">Recent positions</div>
              <div className="space-y-1.5">
                {data.recentPositions.length === 0 ? (
                  <p className="text-xs-2 text-text-muted">No positions have been registered.</p>
                ) : (
                  data.recentPositions.map((position) => (
                    <div key={position.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                            position.direction === "long"
                              ? "bg-success/10 text-success"
                              : "bg-error/10 text-error"
                          }`}
                        >
                          {position.direction.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-text-primary">
                          {Number(position.size_nop ?? 0).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}{" "}
                          NOP
                        </span>
                      </div>
                      <span className="text-[11px] capitalize text-text-muted">{position.status}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            {data.news.length > 0 ? (
              <section className="space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">News pulse</div>
                <div className="space-y-1.5">
                  {data.news.slice(0, 3).map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-border-subtle bg-surface-muted px-3 py-2 transition hover:border-ring-subtle hover:bg-surface"
                    >
                      <p className="text-[11px] font-semibold text-text-primary">{item.title}</p>
                      <p className="text-[10px] text-text-muted">
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
