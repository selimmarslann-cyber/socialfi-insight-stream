import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PUBLIC_ENV } from "@/config/env";

type MarketSignal = {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  signal: "Bullish" | "Neutral" | "Bearish";
  score: number;
};

const API_BASE = PUBLIC_ENV.apiBase || "/api";
const FALLBACK_SIGNALS: MarketSignal[] = [
  {
    symbol: "BTC/USDT",
    price: 62850,
    change24h: 1.42,
    volume: 12800000000,
    signal: "Bullish",
    score: 78,
  },
  {
    symbol: "ETH/USDT",
    price: 3180,
    change24h: 0.85,
    volume: 7200000000,
    signal: "Bullish",
    score: 71,
  },
  {
    symbol: "SOL/USDT",
    price: 142.5,
    change24h: -0.65,
    volume: 1850000000,
    signal: "Neutral",
    score: 62,
  },
  {
    symbol: "AVAX/USDT",
    price: 38.8,
    change24h: -2.1,
    volume: 890000000,
    signal: "Bearish",
    score: 69,
  },
  {
    symbol: "ZK/USDT",
    price: 0.42,
    change24h: 3.2,
    volume: 560000000,
    signal: "Bullish",
    score: 66,
  },
  {
    symbol: "BNB/USDT",
    price: 568.4,
    change24h: 0.78,
    volume: 2100000000,
    signal: "Neutral",
    score: 73,
  },
];

const sentimentBadgeClasses: Record<MarketSignal["signal"], string> = {
  Bullish: "bg-emerald-50 text-emerald-600",
  Neutral: "bg-slate-100 text-slate-600",
  Bearish: "bg-rose-50 text-rose-600",
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);

const formatChange = (value: number) => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const formatVolume = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const AIMarketBar = () => {
  const [signals, setSignals] = useState<MarketSignal[]>(FALLBACK_SIGNALS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const [activeFilter, setActiveFilter] = useState("Top Volume");

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/ai-signals`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`ai_signals_${response.status}`);
      }

      const payload = (await response.json()) as { items?: MarketSignal[] };
      setSignals(payload.items ?? FALLBACK_SIGNALS);
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") {
        return;
      }
      console.warn("AI signals fetch failed", err);
      setSignals(FALLBACK_SIGNALS);
      setError("No signals right now. Retry in a minute.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      controllerRef.current?.abort();
    };
  }, [load]);

  const hasSignals = signals.length > 0;
  const gridContent = useMemo(() => {
    if (!hasSignals) {
      return (
        <p className="text-sm text-slate-500">
          NOP scanners are warming up. Signals will appear shortly.
        </p>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {signals.map((signal) => {
          const changeTone =
            signal.change24h > 0
              ? "text-emerald-500"
              : signal.change24h < 0
              ? "text-rose-500"
              : "text-slate-500";

          return (
            <div
              key={signal.symbol}
              className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/40 px-3 py-3 transition hover:border-indigo-200 hover:bg-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{signal.symbol}</div>
                  <div className="text-[11px] text-slate-500">
                    24H VOL {formatVolume(signal.volume).toUpperCase()}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${sentimentBadgeClasses[signal.signal]}`}
                >
                  {signal.signal}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-sm font-semibold text-slate-900">
                  {formatPrice(signal.price)}
                </div>
                <div className={`text-xs font-medium ${changeTone}`}>{formatChange(signal.change24h)}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Score</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600">
                  {signal.score} / 100
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [hasSignals, signals]);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-indigo-500">
          <span>AI Market Scanner</span>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
            Live 24h delta
          </span>
        </div>
        <div className="hidden gap-2 text-[11px] md:flex">
          {["Top Volume", "DeFi", "AI", "Memes"].map((filter) => (
            <button
              type="button"
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-3 py-1 font-semibold transition ${
                activeFilter === filter
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-500 hover:border-indigo-200"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading && !hasSignals ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-24 rounded-xl border border-dashed border-slate-100 bg-slate-50 animate-pulse" />
            ))}
          </div>
        ) : null}

        {!loading ? gridContent : null}

        {error ? (
          <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs text-amber-700">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">{error}</span>
              <button
                type="button"
                className="font-semibold text-amber-800 underline-offset-2 hover:underline"
                onClick={() => void load()}
              >
                Retry
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default AIMarketBar;
