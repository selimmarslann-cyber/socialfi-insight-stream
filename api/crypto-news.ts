import type { VercelRequest, VercelResponse } from "@vercel/node";
import Parser from "rss-parser";

// Crypto News API - Returns 6 news items with images

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
      ["content:encoded", "content", { keepArray: false }],
      ["content", "content", { keepArray: false }],
      ["description", "description", { keepArray: false }],
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
const REQUIRED_ITEMS = 6;
const MAX_ITEMS = 6;
const FALLBACK_FEEDS = [
  "https://decrypt.co/feed",
  "https://cointelegraph.com/rss",
  "https://www.coindesk.com/arc/outboundfeeds/rss/",
  "https://www.theblock.co/rss.xml",
  "https://bitcoinmagazine.com/.rss/full/",
  "https://www.coinbase.com/blog/rss.xml",
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

const pickImageFromItem = (item: CustomItem, link?: string): string | undefined => {
  // Try enclosure first (most reliable)
  const enclosure = Array.isArray(item.enclosure) ? item.enclosure[0] : item.enclosure;
  if (enclosure?.url) {
    const url = sanitizeImageUrl(enclosure.url);
    if (url) return url;
  }
  
  // Try media:content and media:thumbnail
  const media =
    item.mediaContent?.find((entry) => entry?.$?.url)?.$?.url ??
    item.mediaThumbnail?.find((entry) => entry?.$?.url)?.$?.url;
  if (media) {
    const url = sanitizeImageUrl(media);
    if (url) return url;
  }

  // Try to extract from content/description HTML
  const content = (item as any).content || (item as any).description || "";
  if (typeof content === "string" && content.length > 0) {
    // Look for img tags
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      const url = sanitizeImageUrl(imgMatch[1]);
      if (url) return url;
    }
    // Look for og:image or twitter:image meta tags
    const ogImageMatch = content.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (ogImageMatch && ogImageMatch[1]) {
      const url = sanitizeImageUrl(ogImageMatch[1]);
      if (url) return url;
    }
  }

  // Try to get image from link's Open Graph (if link is provided)
  // This would require fetching the page, so we'll skip for now
  // and rely on the RSS feed's own image data

  return undefined;
};

const normalizeItem = (
  item: CustomItem,
  fallbackSource: string,
): RemoteNewsItem | null => {
  const link = item.link?.trim();
  const publishedAt = item.isoDate ?? item.pubDate ?? new Date().toISOString();
  const fallbackHostname = hostnameFromUrl(fallbackSource);
  const fallbackLabel = fallbackSource.replace(/^https?:\/\//, "") || "crypto-desk";
  const source =
    hostnameFromUrl(link) ??
    fallbackHostname ??
    fallbackLabel;

  if (!link) {
    return null;
  }

  // Try to get image from various sources
  let image = pickImageFromItem(item, link);
  
  // If no image found, use default
  if (!image) {
    image = DEFAULT_IMAGE;
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

  // Prioritize items with images, but don't filter out items without images
  // We'll return up to MAX_ITEMS, prioritizing those with images
  const withImages = deduped.filter(
    (item) => item.imageUrl && item.imageUrl !== DEFAULT_IMAGE,
  );
  const withoutImages = deduped.filter(
    (item) => !item.imageUrl || item.imageUrl === DEFAULT_IMAGE,
  );

  // Combine: first items with images, then items without images
  const prioritized = [...withImages, ...withoutImages];

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
