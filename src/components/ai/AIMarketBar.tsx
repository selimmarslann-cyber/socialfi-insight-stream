import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PUBLIC_ENV } from "@/config/env";

type MarketSignal = {
  symbol: string;
  price: number;
  change24h: number;
  volume?: number;
  signal: "Bullish" | "Neutral" | "Bearish";
  score: number;
  displayValue?: string;
  subtitle?: string;
};

const API_BASE = PUBLIC_ENV.apiBase || "/api";
const FALLBACK_COINS: MarketSignal[] = [
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
    symbol: "ZK/USDT",
    price: 0.42,
    change24h: 3.2,
    volume: 560000000,
    signal: "Bullish",
    score: 66,
  },
];

const BASE_GLOBAL_MARKET_CARDS: MarketSignal[] = [
  {
    symbol: "BTC Dominance",
    price: 52.4,
    change24h: 0.62,
    signal: "Bullish",
    score: 64,
    displayValue: "52.4%",
    subtitle: "Share of global crypto market cap",
  },
  {
    symbol: "Fear & Greed Index",
    price: 50,
    change24h: 0,
    signal: "Neutral",
    score: 50,
    displayValue: "-- / 100",
    subtitle: "Sentiment verisi yükleniyor",
  },
  {
    symbol: "Total Market Cap",
    price: 2480000000000,
    change24h: 1.83,
    signal: "Bullish",
    score: 72,
    displayValue: "$2.48T",
    subtitle: "Combined crypto market value",
  },
];

const DESIRED_COIN_SYMBOLS = ["BTC/USDT", "ETH/USDT", "ZK/USDT"];

const sentimentBadgeClasses: Record<MarketSignal["signal"], string> = {
  Bullish: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  Neutral: "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-200",
  Bearish: "bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-100",
};

const classificationToSignal = (
  classification: string,
): MarketSignal["signal"] => {
  const normalized = classification?.toLowerCase() ?? "";
  if (normalized.includes("greed") || normalized.includes("hırs")) {
    return "Bullish";
  }
  if (normalized.includes("fear") || normalized.includes("korku")) {
    return "Bearish";
  }
  return "Neutral";
};

const formatSentimentSubtitle = (classification: string, isoTime?: string) => {
  if (!isoTime) {
    return classification || "Market sentiment snapshot";
  }

  try {
    const formatted = new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoTime));
    return classification
      ? `${classification} • Güncellendi ${formatted}`
      : `Güncellendi ${formatted}`;
  } catch {
    return classification || "Market sentiment snapshot";
  }
};

const normalizeCoinSignals = (source: MarketSignal[]): MarketSignal[] => {
  const filtered = source.filter((entry) => {
    const uppercase = entry.symbol.toUpperCase();
    return !uppercase.startsWith("SOL") && !uppercase.startsWith("AVAX");
  });

  const registry = new Map<string, MarketSignal>();
  filtered.forEach((entry) => {
    registry.set(entry.symbol, entry);
  });

  const fallbackRegistry = new Map(
    FALLBACK_COINS.map((entry) => [entry.symbol, entry] as const),
  );

  const selectedCoins = DESIRED_COIN_SYMBOLS.map((symbol) => {
    if (registry.has(symbol)) {
      return registry.get(symbol);
    }
    return fallbackRegistry.get(symbol);
  }).filter(Boolean) as MarketSignal[];

  return selectedCoins;
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
  const [coinSignals, setCoinSignals] = useState<MarketSignal[]>(() =>
    normalizeCoinSignals(FALLBACK_COINS),
  );
  const [globalMetrics, setGlobalMetrics] = useState<MarketSignal[]>(() =>
    BASE_GLOBAL_MARKET_CARDS.map((card) => ({ ...card })),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const sentimentControllerRef = useRef<AbortController | null>(null);
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
      setCoinSignals(normalizeCoinSignals(payload.items ?? FALLBACK_COINS));
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") {
        return;
      }
      console.warn("AI signals fetch failed", err);
      setCoinSignals(normalizeCoinSignals(FALLBACK_COINS));
      setError("No signals right now. Retry in a minute.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSentiment = useCallback(async () => {
    sentimentControllerRef.current?.abort();
    const controller = new AbortController();
    sentimentControllerRef.current = controller;

    try {
      const response = await fetch(`${API_BASE}/fear-greed`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`fear_greed_${response.status}`);
      }

      const payload = (await response.json()) as {
        item?: {
          value?: number;
          classification?: string;
          change24h?: number;
          isoTime?: string;
        };
      };

      if (!payload.item) {
        throw new Error("fear_greed_empty");
      }

      const rawValue = Number(payload.item.value ?? 0);
      const rawChange = Number(payload.item.change24h ?? 0);
      const classification = payload.item.classification ?? "Neutral";
      const signal = classificationToSignal(classification);
      const value = Number.isFinite(rawValue)
        ? Math.min(100, Math.max(0, Math.round(rawValue)))
        : 0;
      const change24h = Number.isFinite(rawChange)
        ? Number(rawChange.toFixed(2))
        : 0;
      const isoTime = payload.item.isoTime;

      setGlobalMetrics((current) =>
        current.map((metric) =>
          metric.symbol === "Fear & Greed Index"
            ? {
                ...metric,
                price: value,
                change24h,
                signal,
                score: value,
                displayValue: `${value} / 100`,
                subtitle: formatSentimentSubtitle(classification, isoTime),
              }
            : metric,
        ),
      );
    } catch (err) {
      console.warn("Fear & Greed fetch failed", err);
      setGlobalMetrics((current) =>
        current.map((metric) =>
          metric.symbol === "Fear & Greed Index"
            ? {
                ...metric,
                subtitle: "Sentiment verisi getirilemedi",
              }
            : metric,
        ),
      );
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      controllerRef.current?.abort();
    };
  }, [load]);

  useEffect(() => {
    void fetchSentiment();
    return () => {
      sentimentControllerRef.current?.abort();
    };
  }, [fetchSentiment]);

  const combinedSignals = useMemo(
    () => [...coinSignals, ...globalMetrics],
    [coinSignals, globalMetrics],
  );
  const hasCoinSignals = coinSignals.length > 0;
  const gridContent = useMemo(() => {
      if (combinedSignals.length === 0) {
        return (
          <p className="text-sm text-text-secondary">
            NOP scanners are warming up. Signals will appear shortly.
          </p>
        );
      }

    return (
      <>
          {!hasCoinSignals ? (
            <p className="text-sm text-text-secondary">
              NOP scanners are warming up. Signals will appear shortly.
            </p>
          ) : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {combinedSignals.map((signal) => {
              const changeTone =
                signal.change24h > 0
                  ? "text-emerald-500 dark:text-emerald-300"
                  : signal.change24h < 0
                    ? "text-rose-500 dark:text-rose-300"
                    : "text-text-secondary";
            const subtitle =
              signal.subtitle ??
              (signal.volume
                ? `24H VOL ${formatVolume(signal.volume).toUpperCase()}`
                : "Global metric update");
            const primaryValue = signal.displayValue ?? formatPrice(signal.price);

              return (
                <div
                  key={signal.symbol}
                  className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-3 transition hover:border-ring-subtle hover:bg-surface-muted"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-text-primary">
                        {signal.symbol}
                      </div>
                      <div className="text-[11px] text-text-secondary">{subtitle}</div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${sentimentBadgeClasses[signal.signal]}`}
                    >
                      {signal.signal}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-sm font-semibold text-text-primary">
                      {primaryValue}
                    </div>
                    <div className={`text-xs font-medium ${changeTone}`}>
                      {formatChange(signal.change24h)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-text-secondary">Score</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-100">
                      {signal.score} / 100
                    </span>
                  </div>
                </div>
              );
          })}
        </div>
      </>
    );
  }, [combinedSignals, hasCoinSignals]);

    return (
      <section className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-card-soft">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-500 dark:text-indigo-300">
          <span>AI Market Scanner</span>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100">
            Live 24h delta
          </span>
        </div>
        <div className="hidden gap-2 text-[11px] md:flex">
          {["Top Volume", "DeFi", "AI", "Memes"].map((filter) => (
            <button
              type="button"
              key={filter}
              onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-3 py-1 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-start)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${
                  activeFilter === filter
                    ? "bg-indigo-600 text-white shadow-sm dark:bg-indigo-500"
                    : "border border-border-subtle bg-surface-muted text-text-secondary hover:border-ring-subtle"
                }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

        <div className="mt-4 space-y-3">
          {loading && !hasCoinSignals ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 rounded-xl border border-dashed border-border-subtle bg-surface-muted animate-pulse"
                />
              ))}
            </div>
          ) : null}

        {!loading ? gridContent : null}

        {error ? (
          <div className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">{error}</span>
              <button
                type="button"
                className="font-semibold text-warning underline-offset-2 hover:underline"
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
