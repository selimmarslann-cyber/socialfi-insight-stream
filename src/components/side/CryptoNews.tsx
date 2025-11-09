import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Newspaper, AlertTriangle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  SIDE_CARD_CLASS,
  SIDE_CARD_TITLE_CLASS,
  SIDE_SKELETON_CLASS,
} from '@/components/side/common';

type LoadState = 'idle' | 'loading' | 'success' | 'error';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  image?: string;
}

const RETRY_DELAYS = [500, 1000, 2000];
const NEWS_ENDPOINT = '/api/news?limit=5';

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const fetchNews = async (): Promise<NewsItem[]> => {
  const response = await fetch(NEWS_ENDPOINT, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`news_fetch_failed_${response.status}`);
  }

  const payload = await response.json();
  if (!payload?.items || !Array.isArray(payload.items)) {
    return [];
  }

  return payload.items as NewsItem[];
};

const getRelativeTime = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  return formatDistanceToNow(date, { addSuffix: true });
};

const FallbackSourceMark = ({ source }: { source: string }) => (
  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold uppercase text-indigo-600">
    {source.slice(0, 2)}
  </span>
);

const NewsSkeleton = () => (
  <div className="flex items-start gap-3">
    <span className="h-8 w-8 rounded-full bg-slate-100" />
    <div className="flex-1 space-y-2">
      <div className={cn(SIDE_SKELETON_CLASS, 'w-3/4')} />
      <div className={cn(SIDE_SKELETON_CLASS, 'w-2/5')} />
    </div>
  </div>
);

export const CryptoNews = () => {
  const [status, setStatus] = useState<LoadState>('idle');
  const [items, setItems] = useState<NewsItem[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsRef = useRef<NewsItem[]>([]);

  const loadNews = useCallback(async (withBackoff: boolean) => {
    const hasExistingContent = itemsRef.current.length > 0;
    setStatus(hasExistingContent ? 'success' : 'loading');
    setLastError(null);
    setIsRefreshing(hasExistingContent);

    let attempt = 0;
    const maxAttempts = withBackoff ? RETRY_DELAYS.length + 1 : 1;

    while (attempt < maxAttempts) {
      try {
        const results = await fetchNews();
        itemsRef.current = results;
        setItems(results);
        setStatus('success');
        setIsRefreshing(false);
        return;
      } catch (error) {
        attempt += 1;
        setLastError('temporarily_unavailable');
        if (attempt >= maxAttempts) {
          setStatus('error');
          setIsRefreshing(false);
          return;
        }
        await wait(RETRY_DELAYS[attempt - 1]);
      }
    }
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    void loadNews(true);
  }, [loadNews]);

  const hasContent = items.length > 0;

  const content = useMemo(() => {
    if (status === 'loading' && !hasContent) {
      return (
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <NewsSkeleton key={key} />
          ))}
        </div>
      );
    }

    if (status === 'error' && !hasContent) {
      return (
        <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
          <div className="flex items-start gap-3">
            <span className="rounded-full bg-rose-100 p-1.5 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div className="space-y-2 text-sm">
              <div className="inline-flex items-center gap-2 rounded-md bg-rose-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-600">
                Feed paused
              </div>
              <p className="text-slate-600">
                Temporarily unavailable. We will restore the headlines shortly.
              </p>
              <button
                type="button"
                onClick={() => loadNews(true)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!hasContent) {
      return (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          Headlines will populate as sources refresh.
        </p>
      );
    }

    return (
      <ul className="space-y-3">
        {items.map((item) => {
          const relativeTime = getRelativeTime(item.publishedAt);
          return (
            <li key={item.id}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-xl border border-slate-200/70 bg-white px-3 py-2 transition hover:border-indigo-300 hover:bg-indigo-50/60"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.source}
                    className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <FallbackSourceMark source={item.source} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold uppercase tracking-wide text-indigo-600">
                      {item.source}
                    </span>
                    <span aria-hidden="true">•</span>
                    <time dateTime={item.publishedAt}>{relativeTime}</time>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-700 group-hover:text-indigo-700">
                    {item.title}
                  </p>
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    );
  }, [hasContent, items, loadNews, status]);

  return (
    <section className={SIDE_CARD_CLASS}>
      <header className="flex items-center justify-between">
        <h3 className={SIDE_CARD_TITLE_CLASS}>
          <Newspaper className="h-4 w-4 text-indigo-500" />
          Crypto News
        </h3>
        {isRefreshing && (
          <span className="text-xs text-indigo-500">Refreshing…</span>
        )}
      </header>

      <div className="mt-4">{content}</div>

      {status === 'error' && hasContent && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2 text-xs text-rose-600">
          <span className="font-medium">Feed temporarily unavailable.</span>
          <button
            type="button"
            onClick={() => loadNews(true)}
            className="inline-flex items-center gap-1 font-semibold text-rose-600 underline-offset-2 hover:underline"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {status === 'success' && (
        <p className="mt-4 text-xs text-slate-400">
          Headlines update every few minutes.
        </p>
      )}

      {lastError && status === 'loading' && (
        <p className="mt-4 text-xs text-slate-400">Retrying latest feed…</p>
      )}
    </section>
  );
};
