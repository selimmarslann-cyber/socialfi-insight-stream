import { SERVER_ENV } from "@/config/env";

interface NetlifyEvent {
  httpMethod: string;
}

interface NetlifyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

interface CryptoPanicPost {
  id: string | number;
  title?: string;
  url?: string;
  published_at?: string;
  metadata?: {
    image?: string | null;
    thumbnail?: string | null;
    sentiment?: string | null;
  };
  source?: {
    title?: string;
    domain?: string;
  };
  kind?: string;
}

type CryptoNewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at: string;
  sentiment: string;
  imageUrl: string;
};

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const DEFAULT_PLACEHOLDER = "/placeholder.svg";
const SOURCE_PLACEHOLDERS: Record<string, string> = {
  "coindesk.com": "https://logo.clearbit.com/coindesk.com",
  "cointelegraph.com": "https://logo.clearbit.com/cointelegraph.com",
  "cryptopanic.com": "https://logo.clearbit.com/cryptopanic.com",
  "decrypt.co": "https://logo.clearbit.com/decrypt.co",
};

const CACHE_TTL_MS = 60 * 1000;
let cache:
  | {
      payload: { items: CryptoNewsItem[] };
      expiresAt: number;
    }
  | null = null;

const resolveSentiment = (post: CryptoPanicPost): string => {
  const metaSentiment = post.metadata?.sentiment;
  if (metaSentiment && typeof metaSentiment === "string") {
    return metaSentiment.toLowerCase();
  }
  if (post.kind && typeof post.kind === "string") {
    return post.kind.toLowerCase();
  }
  return "neutral";
};

const hostnameFromUrl = (value?: string): string | null => {
  if (!value) return null;
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  } catch {
    return null;
  }
};

const resolveImage = (post: CryptoPanicPost): string => {
  if (post.metadata?.image) {
    return post.metadata.image;
  }
  if (post.metadata?.thumbnail) {
    return post.metadata.thumbnail;
  }
  const host =
    post.source?.domain ??
    hostnameFromUrl(post.url ?? undefined) ??
    "cryptopanic.com";

  if (host && SOURCE_PLACEHOLDERS[host]) {
    return SOURCE_PLACEHOLDERS[host];
  }

  if (host) {
    return `https://logo.clearbit.com/${host}`;
  }

  return DEFAULT_PLACEHOLDER;
};

const dedupeByUrl = (items: CryptoNewsItem[]): CryptoNewsItem[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.url || seen.has(item.url)) {
      return false;
    }
    seen.add(item.url);
    return true;
  });
};

const fetchCryptoPanic = async (): Promise<CryptoNewsItem[]> => {
  const token = SERVER_ENV.cryptopanicKey;
  if (!token) {
    throw new Error("CRYPTOPANIC_API_KEY is not configured");
  }

  const endpoint = new URL("https://cryptopanic.com/api/v1/posts/");
  endpoint.searchParams.set("auth_token", token);
  endpoint.searchParams.set("currencies", "btc,eth,sol,avax");
  endpoint.searchParams.set("kind", "news");
  endpoint.searchParams.set("public", "true");
  endpoint.searchParams.set("page_size", "20");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(endpoint.toString(), {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`cryptopanic_${response.status}`);
    }

    const payload = (await response.json()) as { results?: CryptoPanicPost[] };
    const results = Array.isArray(payload.results) ? payload.results : [];

    const mapped = results
      .filter((item) => Boolean(item.url))
      .map((item): CryptoNewsItem => {
        const sourceLabel =
          item.source?.title ??
          hostnameFromUrl(item.url ?? undefined) ??
          "Crypto Desk";

        return {
          id: `cryptopanic-${item.id}`,
          title: item.title ?? "Untitled market update",
          url: item.url ?? "https://cryptopanic.com",
          source: sourceLabel,
          published_at:
            item.published_at ?? new Date().toISOString(),
          sentiment: resolveSentiment(item),
          imageUrl: resolveImage(item),
        };
      });

    const unique = dedupeByUrl(mapped);
    unique.sort(
      (a, b) =>
        new Date(b.published_at).getTime() -
        new Date(a.published_at).getTime(),
    );

    return unique.slice(0, 8);
  } finally {
    clearTimeout(timeout);
  }
};

const buildResponse = (items: CryptoNewsItem[]): NetlifyResponse => ({
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
    const items = await fetchCryptoPanic();
    cache = {
      payload: { items },
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    return buildResponse(items);
  } catch (error) {
    console.error("[api/crypto-news] failed", error);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({
        items: [],
        error: "crypto_news_unavailable",
      }),
    };
  }
};

