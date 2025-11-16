import type { VercelRequest, VercelResponse } from "@vercel/node";
import Parser from "rss-parser";

type RemoteNewsItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  imageUrl: string;
  publishedAt: string;
};

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
  items: RemoteNewsItem[];
  expiresAt: number;
};

let cache: CacheBucket | null = null;

const withHeaders = (res: VercelResponse): VercelResponse => {
  Object.entries(HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  return res;
};

const respond = (
  res: VercelResponse,
  statusCode: number,
  payload: Record<string, unknown>,
) => {
  withHeaders(res).status(statusCode).json(payload);
};

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
): RemoteNewsItem | null => {
    const link = item.link?.trim();
    const publishedAt = item.isoDate ?? item.pubDate ?? new Date().toISOString();
    const source =
      hostnameFromUrl(link) ??
      hostnameFromUrl(fallbackSource) ??
      (fallbackSource.replace(/^https?:\/\//, "") || "crypto-desk");

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

const parseSingleFeed = async (url: string): Promise<RemoteNewsItem[]> => {
  const feed = await parser.parseURL(url);
  const items = feed.items ?? [];
  const mapped = items
    .map((entry) => normalizeItem(entry, url))
    .filter((entry): entry is RemoteNewsItem => Boolean(entry));
  return mapped;
};

const fetchAllFeeds = async (): Promise<RemoteNewsItem[]> => {
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

  const combined: RemoteNewsItem[] = [];
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
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  const withImages = deduped.filter(
    (item) => item.imageUrl && item.imageUrl !== DEFAULT_IMAGE,
  );
  const prioritized =
    withImages.length >= REQUIRED_ITEMS ? withImages : deduped;

  return prioritized.slice(0, MAX_ITEMS);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    withHeaders(res).status(204).end();
    return;
  }

  if (req.method !== "GET") {
    respond(res, 405, { items: [], error: "method_not_allowed" });
    return;
  }

  if (cache && Date.now() < cache.expiresAt) {
    respond(res, 200, { items: cache.items });
    return;
  }

  try {
    const items = await fetchAllFeeds();
    cache = {
      items,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    respond(res, 200, { items });
  } catch (error) {
    console.error("[api/crypto-news] failed", error);
    respond(res, 500, {
      items: [],
      error: "crypto_news_unavailable",
    });
  }
}
