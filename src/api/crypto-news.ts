import Parser from "rss-parser";

interface NetlifyEvent {
  httpMethod: string;
}

interface NetlifyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

type FeedEnclosure = { url?: string };

type CustomItem = {
  title?: string;
  link?: string;
  guid?: string;
  isoDate?: string;
  pubDate?: string;
  enclosure?: FeedEnclosure | FeedEnclosure[];
  mediaContent?: Array<{ $?: { url?: string } }>;
  mediaThumbnail?: Array<{ $?: { url?: string } }>;
};

type CryptoNewsItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  imageUrl: string;
};

const parser = new Parser<CustomItem>({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
    ],
  },
});

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const DEFAULT_IMAGE = "/placeholder.svg";
const CACHE_TTL_MS = 60 * 1000;
const REQUIRED_ITEMS = 3;
const MAX_ITEMS = REQUIRED_ITEMS;
const FALLBACK_FEEDS = [
  "https://decrypt.co/feed",
  "https://cointelegraph.com/rss",
  "https://www.coindesk.com/arc/outboundfeeds/rss/",
] as const;

type CacheBucket = {
  items: CryptoNewsItem[];
  expiresAt: number;
};

let cache: CacheBucket | null = null;

const hostnameFromUrl = (value?: string): string | null => {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
};

const sanitizeImageUrl = (value?: string): string | undefined => {
  if (!value) return undefined;
  if (value.startsWith("//")) {
    return `https:${value}`;
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  try {
    const url = new URL(value, "https://decrypt.co");
    return url.toString();
  } catch {
    return undefined;
  }
};

const pickImageFromItem = (item: CustomItem): string | undefined => {
  const enclosure = Array.isArray(item.enclosure) ? item.enclosure[0] : item.enclosure;
  if (enclosure?.url) {
    return sanitizeImageUrl(enclosure.url);
  }
  const media =
    item.mediaContent?.find((entry) => entry?.$?.url)?.$?.url ??
    item.mediaThumbnail?.find((entry) => entry?.$?.url)?.$?.url;
  return sanitizeImageUrl(media);
};

const normalizeItem = (
  item: CustomItem,
  fallbackSource: string,
): CryptoNewsItem | null => {
  const link = item.link?.trim();
  const publishedAt =
    item.isoDate ?? item.pubDate ?? new Date().toISOString();
  const source =
    hostnameFromUrl(link) ??
    hostnameFromUrl(fallbackSource) ??
    fallbackSource.replace(/^https?:\/\//, "") ||
    "crypto-desk";

  if (!link) {
    return null;
  }

  const image = pickImageFromItem(item);
  if (!image) {
    return null;
  }
  const identifier = item.guid ?? `${source}-${link}`;

  return {
    id: identifier,
    title: (item.title ?? "Untitled update").trim(),
    link,
    source,
    publishedAt,
    imageUrl: image,
  };
};

const parseSingleFeed = async (url: string): Promise<CryptoNewsItem[]> => {
  const feed = await parser.parseURL(url);
  const items = feed.items ?? [];
  const mapped = items
    .map((entry) => normalizeItem(entry, url))
    .filter((entry): entry is CryptoNewsItem => Boolean(entry));
  return mapped;
};

const fetchAllFeeds = async (): Promise<CryptoNewsItem[]> => {
  const csv = process.env.VITE_NEWS_RSS ?? "";
  const feeds = csv
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const resolvedFeeds = feeds.length > 0 ? feeds : [...FALLBACK_FEEDS];

  const results = await Promise.allSettled(
    resolvedFeeds.map(async (feedUrl) => {
      try {
        return await parseSingleFeed(feedUrl);
      } catch (error) {
        console.warn("[crypto-news] feed failed", feedUrl, error);
        return [];
      }
    }),
  );

  const combined: CryptoNewsItem[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      combined.push(...result.value);
    }
  }

  const seen = new Set<string>();
  const deduped = combined.filter((item) => {
    if (seen.has(item.link)) {
      return false;
    }
    seen.add(item.link);
    return true;
  });

  deduped.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  const withImages = deduped.filter(
    (item) => item.imageUrl && item.imageUrl !== DEFAULT_IMAGE,
  );
  const prioritized =
    withImages.length >= REQUIRED_ITEMS ? withImages : deduped;

  return prioritized.slice(0, MAX_ITEMS);
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
    return buildResponse(cache.items);
  }

  try {
    const items = await fetchAllFeeds();
    cache = {
      items,
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

