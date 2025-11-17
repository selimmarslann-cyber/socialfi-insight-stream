import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PUBLIC_ENV } from "@/config/env";
import { cn } from "@/lib/utils";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";

type RemoteNewsItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  imageUrl?: string;
  publishedAt: string;
};

const API_BASE = PUBLIC_ENV.apiBase || "/api";
const MAX_NEWS_ITEMS = 6;
const FALLBACK_IMAGE = "/placeholder.svg";

const fallbackTimestamp = (minutesAgo: number) =>
  new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();

const FALLBACK_NEWS: RemoteNewsItem[] = [
  {
    id: "fallback-btc-inflows",
    title:
      "Bitcoin ETF inflows push price back above $65K as liquidity returns",
    link: "https://www.coindesk.com/markets/2024/05/21/bitcoin-etf-inflows-push-price",
    source: "CoinDesk",
    imageUrl: FALLBACK_IMAGE,
    publishedAt: fallbackTimestamp(45),
  },
  {
    id: "fallback-eth-pectra",
    title: "Ethereum core devs lock timeline for the Pectra upgrade in Q1 2025",
    link: "https://www.theblock.co/post/pectra-upgrade-timeline",
    source: "The Block",
    imageUrl: FALLBACK_IMAGE,
    publishedAt: fallbackTimestamp(90),
  },
  {
    id: "fallback-stablecoin-bill",
    title:
      "US stablecoin bill advances as committee adds stronger reserve language",
    link: "https://www.bloomberg.com/news/articles/stablecoin-bill-committee-advance",
    source: "Bloomberg Crypto",
    imageUrl: FALLBACK_IMAGE,
    publishedAt: fallbackTimestamp(135),
  },
  {
    id: "fallback-l2-usage",
    title:
      "Layer-2 usage hits new ATH with 28M daily transactions across the stack",
    link: "https://messari.io/article/layer2-daily-txs-ath",
    source: "Messari",
    imageUrl: FALLBACK_IMAGE,
    publishedAt: fallbackTimestamp(180),
  },
  {
    id: "fallback-staking-demand",
    title:
      "Institutional staking products see record demand ahead of new SEC clarity",
    link: "https://decrypt.co/187000/institutional-staking-demand-sec",
    source: "Decrypt",
    imageUrl: FALLBACK_IMAGE,
    publishedAt: fallbackTimestamp(225),
  },
  {
    id: "fallback-ai-rally",
    title:
      "AI-linked tokens rally as new frontier funds rotate into data infrastructure",
    link: "https://cointelegraph.com/news/ai-crypto-rally-data-infrastructure",
    source: "Cointelegraph",
    imageUrl: FALLBACK_IMAGE,
    publishedAt: fallbackTimestamp(270),
  },
];

const mergeWithFallback = (items: RemoteNewsItem[]): RemoteNewsItem[] => {
  const trimmed = (items ?? []).slice(0, MAX_NEWS_ITEMS);
  if (trimmed.length >= MAX_NEWS_ITEMS) {
    return trimmed;
  }
  const seenIds = new Set(trimmed.map((item) => item.id));
  const fillers: RemoteNewsItem[] = [];

  for (const fallback of FALLBACK_NEWS) {
    if (!seenIds.has(fallback.id)) {
      fillers.push(fallback);
    }
    if (trimmed.length + fillers.length >= MAX_NEWS_ITEMS) {
      break;
    }
  }

  return [...trimmed, ...fillers];
};

const timeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

const toRelativeTime = (value: string): string => {
  const published = new Date(value).getTime();
  if (Number.isNaN(published)) {
    return "just now";
  }
  const diffMs = published - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffMinutes) < 60) {
    return timeFormatter.format(diffMinutes, "minute");
  }
  if (Math.abs(diffHours) < 24) {
    return timeFormatter.format(diffHours, "hour");
  }
  return timeFormatter.format(diffDays, "day");
};

type CryptoNewsProps = {
  className?: string;
};

export default function CryptoNews({ className }: CryptoNewsProps) {
  const [items, setItems] = useState<RemoteNewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/crypto-news`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`crypto_news_${response.status}`);
      }

      const payload = (await response.json()) as { items?: RemoteNewsItem[] };

      setItems(mergeWithFallback(payload.items ?? []));
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") {
        return;
      }
      console.warn("Crypto news fetch failed", err);
      setItems(mergeWithFallback([]));
      setError("Temporarily unavailable. Retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      controllerRef.current?.abort();
    };
  }, [load]);

  const hasItems = items.length > 0;
  const headlineList = useMemo(() => {
    if (!hasItems) {
      return null;
    }
      return items.map((item) => (
        <a
          key={item.id}
          href={item.link}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-3 rounded-2xl border border-slate-100/80 bg-white/80 px-3 py-2 transition hover:border-indigo-200 hover:bg-slate-50"
        >
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
          <img
            src={item.imageUrl || FALLBACK_IMAGE}
            alt={item.source}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
        </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-indigo-600">
            {item.title}
          </p>
            <div className="text-xs text-slate-500">
            {item.source} • {toRelativeTime(item.publishedAt)}
          </div>
        </div>
      </a>
    ));
  }, [hasItems, items]);

  return (
    <DashboardCard className={cn("p-4 md:p-5", className)}>
      <DashboardSectionTitle label="Market Pulse" title="Crypto News" />

      {loading && !hasItems ? (
        <div className="space-y-3">
          {Array.from({ length: MAX_NEWS_ITEMS }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-2xl border border-slate-100/80 bg-slate-50/60 px-3 py-2">
              <div className="h-10 w-10 rounded-xl bg-white/80" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded-full bg-slate-100" />
                <div className="h-3 w-1/3 rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && hasItems ? (
        <div className="space-y-3">{headlineList}</div>
      ) : null}

      {!loading && !hasItems && !error ? (
        <p className="text-xs text-slate-500">No AI-curated signals yet. Check back shortly.</p>
      ) : null}

      {error ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-700">
          <span className="font-semibold">{error}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-amber-700 hover:bg-amber-100 hover:text-amber-900"
            onClick={() => void load()}
          >
            Retry
          </Button>
        </div>
      ) : null}
    </DashboardCard>
  );
}
