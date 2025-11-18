const MARKET_SYMBOLS = [
  { pair: "BTCUSDT", label: "BTC/USDT", gecko: "bitcoin" },
  { pair: "ETHUSDT", label: "ETH/USDT", gecko: "ethereum" },
  { pair: "SOLUSDT", label: "SOL/USDT", gecko: "solana" },
  { pair: "AVAXUSDT", label: "AVAX/USDT", gecko: "avalanche-2" },
] as const;

const BINANCE_ENDPOINT = "https://api.binance.com/api/v3/ticker/24hr";
const COINGECKO_ENDPOINT = "https://api.coingecko.com/api/v3/coins/markets";
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

type CoinGeckoRow = {
  id: string;
  current_price?: number;
  price_change_percentage_24h?: number;
  total_volume?: number;
};

type CacheRecord = {
  items: PriceSignal[];
  expiresAt: number;
};

let cache: CacheRecord | null = null;

const FALLBACK_SIGNALS: PriceSignal[] = [
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

const requestCoinGeckoMarkets = async (): Promise<CoinGeckoRow[]> => {
  const url = new URL(COINGECKO_ENDPOINT);
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set(
    "ids",
    MARKET_SYMBOLS.map((config) => config.gecko).join(","),
  );
  url.searchParams.set("price_change_percentage", "24h");
  url.searchParams.set("sparkline", "false");
  url.searchParams.set("per_page", `${MARKET_SYMBOLS.length}`);
  url.searchParams.set("page", "1");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "nop-market-scanner/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`coingecko_${response.status}`);
    }

    return (await response.json()) as CoinGeckoRow[];
  } finally {
    clearTimeout(timeout);
  }
};

const mapCoinGeckoToSignals = (rows: CoinGeckoRow[]): PriceSignal[] => {
  const byId = new Map(rows.map((row) => [row.id, row]));

  return MARKET_SYMBOLS.map((config) => {
    const row = byId.get(config.gecko);
    const price = Number(row?.current_price ?? 0);
    const change = Number(row?.price_change_percentage_24h ?? 0);
    const volume = Number(row?.total_volume ?? 0);
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

  try {
    const rows = await requestBinanceTickers();
    const items = mapTickersToSignals(rows);
    cache = {
      items,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    return items;
  } catch (binanceError) {
    console.warn("[market] binance snapshot failed", binanceError);
    try {
      const rows = await requestCoinGeckoMarkets();
      const items = mapCoinGeckoToSignals(rows);
      cache = {
        items,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
      return items;
    } catch (geckoError) {
      console.error("[market] coingecko fallback failed", geckoError);
      cache = {
        items: FALLBACK_SIGNALS,
        expiresAt: Date.now() + CACHE_TTL_MS / 2,
      };
      return FALLBACK_SIGNALS;
    }
  }
};
