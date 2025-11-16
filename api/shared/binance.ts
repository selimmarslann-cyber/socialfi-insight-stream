const MARKET_SYMBOLS = [
  { pair: "BTCUSDT", label: "BTC/USDT" },
  { pair: "ETHUSDT", label: "ETH/USDT" },
  { pair: "SOLUSDT", label: "SOL/USDT" },
  { pair: "AVAXUSDT", label: "AVAX/USDT" },
] as const;

const BINANCE_ENDPOINT = "https://api.binance.com/api/v3/ticker/24hr";
const CACHE_TTL_MS = 60 * 1000;

type SignalTone = "Bullish" | "Neutral" | "Bearish";

export type PriceSignal = {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  signal: SignalTone;
  score: number;
};

type BinanceTicker = {
  symbol: string;
  lastPrice?: string;
  priceChangePercent?: string;
  volume?: string;
};

type CacheRecord = {
  items: PriceSignal[];
  expiresAt: number;
};

let cache: CacheRecord | null = null;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const deriveSignal = (change: number): { signal: SignalTone; score: number } => {
  if (change > 3) {
    return {
      signal: "Bullish",
      score: clamp(70 + Math.round(Math.min(change, 15)), 70, 85),
    };
  }

  if (change < -3) {
    return {
      signal: "Bearish",
      score: clamp(70 + Math.round(Math.min(Math.abs(change), 15)), 70, 85),
    };
  }

  return {
    signal: "Neutral",
    score: clamp(55 + Math.round(Math.min(Math.abs(change), 10)), 55, 70),
  };
};

const requestBinanceTickers = async (): Promise<BinanceTicker[]> => {
  const url = new URL(BINANCE_ENDPOINT);
  url.searchParams.set(
    "symbols",
    JSON.stringify(MARKET_SYMBOLS.map((config) => config.pair)),
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`binance_${response.status}`);
    }

    const payload = (await response.json()) as BinanceTicker[] | BinanceTicker;
    return Array.isArray(payload) ? payload : [payload];
  } finally {
    clearTimeout(timeout);
  }
};

const mapTickersToSignals = (rows: BinanceTicker[]): PriceSignal[] => {
  const bySymbol = new Map(rows.map((row) => [row.symbol, row]));

  return MARKET_SYMBOLS.map((config) => {
    const row = bySymbol.get(config.pair);
    const price = Number(row?.lastPrice ?? 0);
    const change = Number(row?.priceChangePercent ?? 0);
    const volume = Number(row?.volume ?? 0);
    const ai = deriveSignal(change);

    return {
      symbol: config.label,
      price: Number.isFinite(price)
        ? Number(price.toFixed(price >= 1000 ? 0 : 2))
        : 0,
      change24h: Number.isFinite(change) ? Number(change.toFixed(2)) : 0,
      volume: Number.isFinite(volume) ? Math.round(volume) : 0,
      signal: ai.signal,
      score: ai.score,
    };
  });
};

export const getMarketSnapshot = async (): Promise<PriceSignal[]> => {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.items;
  }

  const rows = await requestBinanceTickers();
  const items = mapTickersToSignals(rows);

  cache = {
    items,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  return items;
};
