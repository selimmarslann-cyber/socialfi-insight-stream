import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PUBLIC_ENV } from "@/config/env";
import { cn } from "@/lib/utils";

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

      setItems((payload.items ?? []).slice(0, MAX_NEWS_ITEMS));
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") {
        return;
      }
      console.warn("Crypto news fetch failed", err);
      setItems([]);
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
          className="group flex items-center gap-3 py-2"
        >
          <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-md border border-slate-100 bg-slate-100">
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
            <p className="text-xs font-medium text-slate-900 line-clamp-2 group-hover:text-indigo-600">
              {item.title}
            </p>
            <div className="text-[11px] text-slate-500">
              {item.source} • {toRelativeTime(item.publishedAt)}
            </div>
          </div>
        </a>
      ));
  }, [hasItems, items]);

  return (
    <div className={cn("rounded-2xl border border-slate-100 bg-white p-5 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Crypto News — AI Signals</p>
          <p className="text-[11px] text-slate-500">Realtime feeds scored by the NOP AI Engine</p>
        </div>
      </div>

      {loading && !hasItems ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: MAX_NEWS_ITEMS }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-slate-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded-full bg-slate-100 animate-pulse" />
                <div className="h-3 w-1/2 rounded-full bg-slate-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && hasItems ? (
        <div className="mt-4 divide-y divide-slate-100">{headlineList}</div>
      ) : null}

      {!loading && !hasItems && !error ? (
        <p className="mt-4 text-sm text-slate-500">No AI-curated signals yet. Check back shortly.</p>
      ) : null}

      {error ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-700">
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
    </div>
  );
}
