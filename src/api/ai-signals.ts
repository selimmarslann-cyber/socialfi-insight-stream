import { computeAIFromRules } from "@/lib/ai/ruleBasedEngine";

interface NetlifyEvent {
  httpMethod: string;
}

interface NetlifyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

type CoinGeckoMarket = {
  id: string;
  symbol: string;
  current_price?: number;
  price_change_percentage_24h?: number;
  total_volume?: number;
  market_cap_change_percentage_24h?: number;
};

type MarketSignal = {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  signal: string;
  volatility: string;
  mmActivity: string;
  score: number;
};

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const MARKET_CONFIG = [
  { id: "bitcoin", symbol: "BTC", baselineVolume: 18_000_000_000 },
  { id: "ethereum", symbol: "ETH", baselineVolume: 8_000_000_000 },
  { id: "solana", symbol: "SOL", baselineVolume: 2_500_000_000 },
  { id: "avalanche-2", symbol: "AVAX", baselineVolume: 1_200_000_000 },
] as const;

const CACHE_TTL_MS = 60 * 1000;
let cache:
  | {
      payload: { items: MarketSignal[] };
      expiresAt: number;
    }
  | null = null;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const fetchMarkets = async (): Promise<MarketSignal[]> => {
  const endpoint = new URL("https://api.coingecko.com/api/v3/coins/markets");
  endpoint.searchParams.set("vs_currency", "usd");
  endpoint.searchParams.set(
    "ids",
    MARKET_CONFIG.map((coin) => coin.id).join(","),
  );
  endpoint.searchParams.set("price_change_percentage", "24h");
  endpoint.searchParams.set("per_page", String(MARKET_CONFIG.length));
  endpoint.searchParams.set("page", "1");
  endpoint.searchParams.set("sparkline", "false");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(endpoint.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`coingecko_${response.status}`);
    }

    const payload = (await response.json()) as CoinGeckoMarket[];
    const marketMap = new Map(payload.map((row) => [row.id, row]));

    const items: MarketSignal[] = [];

    for (const config of MARKET_CONFIG) {
      const row = marketMap.get(config.id);
      if (!row) continue;

      const price = Number(row.current_price ?? 0);
      const change24h = Number(row.price_change_percentage_24h ?? 0);
      const rawVolume = Number(row.total_volume ?? 0);
      const marketCapShift = Number(
        row.market_cap_change_percentage_24h ?? change24h,
      );

      const volumeChangePct =
        config.baselineVolume > 0
          ? ((rawVolume - config.baselineVolume) / config.baselineVolume) * 100
          : 0;

      const sentimentHint =
        change24h > 3
          ? "bullish"
          : change24h < -3
            ? "bearish"
            : marketCapShift > 1
              ? "bullish"
              : marketCapShift < -1
                ? "bearish"
                : "neutral";

      const ai = computeAIFromRules({
        symbol: config.symbol,
        priceChange24h: change24h,
        volumeChange24h: volumeChangePct,
        fundingRate: 0,
        sentimentHint,
      });

      items.push({
        symbol: config.symbol,
        price: Number(price.toFixed(2)),
        change24h: Number(change24h.toFixed(2)),
        volume24h: Math.round(rawVolume),
        signal: ai.aiSignal,
        volatility: ai.aiVolatility,
        mmActivity: ai.aiMmActivity,
        score: clamp(ai.aiScore, 40, 90),
      });
    }

    return items;
  } finally {
    clearTimeout(timeout);
  }
};

const buildResponse = (items: MarketSignal[]): NetlifyResponse => ({
  statusCode: 200,
  headers: HEADERS,
  body: JSON.stringify({ items }),
});

export const handler = async (
  event: NetlifyEvent,
): Promise<NetlifyResponse> => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: HEADERS, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: HEADERS,
      body: JSON.stringify({ items: [], error: "method_not_allowed" }),
    };
  }

  if (cache && Date.now() < cache.expiresAt) {
    return buildResponse(cache.payload.items);
  }

  try {
    const items = await fetchMarkets();
    cache = {
      payload: { items },
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    return buildResponse(items);
  } catch (error) {
    console.error("[api/ai-signals] failed", error);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({
        items: [],
        error: "ai_signals_unavailable",
      }),
    };
  }
};

