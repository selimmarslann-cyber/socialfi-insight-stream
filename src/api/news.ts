import fs from 'node:fs/promises';
import path from 'node:path';
import RSSParser from 'rss-parser';

interface NetlifyEvent {
  httpMethod: string;
  queryStringParameters?: Record<string, string | undefined>;
}

interface NetlifyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  image?: string;
}

interface CachePayload {
  timestamp: number;
  items: NewsItem[];
}

interface CryptoPanicPost {
  id: string | number;
  title?: string;
  url: string;
  published_at?: string;
  metadata?: {
    image?: string;
  };
  source?: {
    title?: string;
  };
}

const CACHE_TTL = 30_000;
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'news.json');
const MAX_ITEMS = 12;

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const rssParser = new RSSParser({
  headers: {
    'User-Agent': 'NilProNewsBot/1.0 (+https://nilpro.app)',
  },
});

const placeholderNews: NewsItem[] = [
  {
    id: 'placeholder-1',
    title: 'Digital asset flows hold steady as institutions await catalysts',
    source: 'NIL Desk',
    url: 'https://nilpro.app/news/digital-assets',
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'placeholder-2',
    title: 'Layer-2 fees compress; zk rollups lead week-on-week savings',
    source: 'NIL Desk',
    url: 'https://nilpro.app/news/l2-fees',
    publishedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'placeholder-3',
    title: 'Top DAOs rotate treasuries toward staked ETH strategies',
    source: 'NIL Desk',
    url: 'https://nilpro.app/news/dao-treasuries',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

const dedupeByUrl = (items: NewsItem[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.url) {
      return false;
    }
    if (seen.has(item.url)) {
      return false;
    }
    seen.add(item.url);
    return true;
  });
};

const fetchCryptoPanic = async (limit: number): Promise<NewsItem[]> => {
  const token =
    process.env.VITE_CRYPTOPANIC_KEY ?? process.env.CRYPTOPANIC_API_KEY;
  if (!token) {
    return [];
  }

  const endpoint = new URL('https://cryptopanic.com/api/v1/posts/');
  endpoint.searchParams.set('auth_token', token);
  endpoint.searchParams.set('kind', 'news');
  endpoint.searchParams.set('filter', 'hot');
  endpoint.searchParams.set('public', 'true');
  endpoint.searchParams.set('page_size', String(Math.min(limit, 50)));

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(endpoint.toString(), {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      throw new Error(`CryptoPanic request failed: ${response.status}`);
    }

    const payload = (await response.json()) as { results?: unknown };
    const results = Array.isArray(payload?.results)
      ? (payload.results as CryptoPanicPost[])
      : [];

    return results.map((item) => ({
      id: `cryptopanic-${item.id}`,
      title: item.title ?? 'Untitled',
      source: item.source?.title ?? 'CryptoPanic',
      url: item.url,
      publishedAt: item.published_at ?? new Date().toISOString(),
      image: item.metadata?.image,
    }));
  } catch (error) {
    console.warn('CryptoPanic feed unavailable', error);
    return [];
  }
};

const RSS_SOURCES: Array<{ id: string; url: string; label: string }> = [
  {
    id: 'decrypt',
    url: 'https://decrypt.co/feed',
    label: 'Decrypt',
  },
  {
    id: 'coindesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml',
    label: 'CoinDesk',
  },
  {
    id: 'cointelegraph',
    url: 'https://cointelegraph.com/rss',
    label: 'CoinTelegraph',
  },
];

const fetchRssSource = async (
  source: (typeof RSS_SOURCES)[number],
  limit: number,
): Promise<NewsItem[]> => {
  const feed = await rssParser.parseURL(source.url);
  if (!Array.isArray(feed.items)) {
    return [];
  }

  return feed.items.slice(0, limit).map((item, index) => ({
    id: `${source.id}-${item.guid ?? item.link ?? index}`,
    title: item.title ?? 'Untitled',
    source: source.label,
    url: item.link ?? '',
    publishedAt:
      item.isoDate ??
      item.pubDate ??
      new Date(Date.now() - index * 60_000).toISOString(),
    image:
      (item.enclosure as { url?: string } | undefined)?.url ??
      (item['media:content'] as { $?: { url?: string } } | undefined)?.$?.url,
  }));
};

const ensureCacheDir = async () => {
  await fs.mkdir(CACHE_DIR, { recursive: true });
};

const readCache = async (): Promise<CachePayload | null> => {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      typeof parsed.timestamp === 'number' &&
      Array.isArray(parsed.items)
    ) {
      return parsed as CachePayload;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('Failed to read news cache', error);
    }
  }
  return null;
};

const writeCache = async (items: NewsItem[]) => {
  await ensureCacheDir();
  const payload: CachePayload = {
    timestamp: Date.now(),
    items,
  };
  await fs.writeFile(CACHE_FILE, JSON.stringify(payload, null, 2), 'utf8');
};

const resolveNews = async (limit: number): Promise<NewsItem[]> => {
  const cryptoPanic = await fetchCryptoPanic(limit);

  const rssResults = await Promise.allSettled(
    RSS_SOURCES.map((source) => fetchRssSource(source, limit)),
  );

  const rssItems = rssResults.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : [],
  );

  const combined = dedupeByUrl([...cryptoPanic, ...rssItems]);
  combined.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return combined.slice(0, limit);
};

const createResponse = (items: NewsItem[]): NetlifyResponse => ({
  statusCode: 200,
  headers: HEADERS,
  body: JSON.stringify({ items }),
});

export const handler = async (
  event: NetlifyEvent,
): Promise<NetlifyResponse> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const limitParam = event.queryStringParameters?.limit;
  const limit = Math.min(
    MAX_ITEMS,
    Math.max(1, Number.parseInt(limitParam ?? '5', 10) || 5),
  );

  const cached = await readCache();
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return createResponse(cached.items.slice(0, limit));
  }

  try {
    const items = await resolveNews(limit);
    if (items.length > 0) {
      await writeCache(items);
      return createResponse(items);
    }
  } catch (error) {
    console.warn('Failed to fetch latest news', error);
  }

  if (cached) {
    return createResponse(cached.items.slice(0, limit));
  }

  return createResponse(placeholderNews.slice(0, limit));
};
