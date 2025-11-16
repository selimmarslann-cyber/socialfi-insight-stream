import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { PUBLIC_ENV } from "@/config/env";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

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
];

const toneClasses: Record<MarketSignal["signal"], string> = {
  Bullish: "bg-emerald-50 text-emerald-600 border-emerald-100",
  Neutral: "bg-slate-50 text-slate-600 border-slate-100",
  Bearish: "bg-rose-50 text-rose-600 border-rose-100",
};

const iconForSignal: Record<MarketSignal["signal"], JSX.Element> = {
  Bullish: <ArrowUpRight className="h-3.5 w-3.5" />,
  Neutral: <Minus className="h-3.5 w-3.5" />,
  Bearish: <ArrowDownRight className="h-3.5 w-3.5" />,
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
      <div className="grid gap-3 md:grid-cols-2">
        {signals.map((signal) => (
          <div
            key={signal.symbol}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/80 px-3 py-2 shadow-sm"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {signal.symbol}
              </p>
              <p className="text-xs text-slate-500">
                {formatPrice(signal.price)} · {formatChange(signal.change24h)}
              </p>
            </div>
              <div className="flex flex-col items-end gap-2 text-xs font-semibold">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${toneClasses[signal.signal]}`}
              >
                {iconForSignal[signal.signal]}
                {signal.signal}
              </span>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
                Score {signal.score}/100
              </span>
                <span className="text-[11px] uppercase tracking-wide text-slate-400">
                  24h Vol {formatVolume(signal.volume)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }, [hasSignals, signals]);

  return (
    <section className="rounded-2xl border border-indigo-500/10 bg-white/80 p-4 shadow-sm ring-1 ring-indigo-500/5 backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <Badge className="rounded-full bg-indigo-500/10 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
            AI
          </Badge>
          <span className="font-medium text-slate-800">
            NOP Intelligence Layer · AI Market Scanner
          </span>
        </div>
        <div className="text-xs font-semibold text-slate-500">
          {loading ? "Refreshing markets…" : "Live 24h delta"}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading && !hasSignals ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-20 rounded-xl border border-dashed border-slate-100 bg-slate-50 animate-pulse"
              />
            ))}
          </div>
        ) : null}

        {!loading ? gridContent : null}

        {error ? (
          <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs text-amber-700">
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
