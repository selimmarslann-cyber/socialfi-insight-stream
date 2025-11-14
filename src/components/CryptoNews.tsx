import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { fetchRssFeed } from "@/lib/rss";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type NewsRow = {
  title: string;
  url: string;
  source?: string;
  published_at?: string;
};

const resolveFeeds = () => {
  if (typeof process !== "undefined" && process?.env?.NEXT_PUBLIC_NEWS_RSS) {
    return process.env.NEXT_PUBLIC_NEWS_RSS;
  }
  if (typeof import.meta !== "undefined") {
    const metaEnv = import.meta.env as Record<string, string | undefined>;
    return (
      metaEnv.NEXT_PUBLIC_NEWS_RSS ||
      metaEnv.VITE_NEXT_PUBLIC_NEWS_RSS ||
      metaEnv.VITE_NEWS_RSS ||
      ""
    );
  }
  return "";
};

const FEEDS = resolveFeeds();

export default function CryptoNews() {
  const [rows, setRows] = useState<NewsRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.log("NEWS_FEEDS", FEEDS);
    }
  }, []);

  const load = async () => {
    if (!FEEDS) {
      setErr("RSS feed list missing.");
      return;
    }

    setErr(null);

    try {
      const data = await fetchRssFeed(FEEDS, 8);
      setRows(data);

      if (data.length > 0 && supabase) {
        const payload = data.map((item) => ({
          title: item.title,
          url: item.url,
          source: item.source,
          published_at: item.published_at,
        }));

        const insertResult = await supabase
          .from("news_cache")
          .insert(payload)
          .select("*")
          .limit(1);

        if (typeof window !== "undefined") {
          // eslint-disable-next-line no-console
          console.log("NEWS_CACHE_INSERT_SELECT", insertResult.data);
        }
      }
    } catch (error) {
      const message = (error as { message?: string } | null)?.message || "Feed unavailable";
      setErr(message);

      try {
        if (!supabase) {
          return;
        }

        const { data } = await supabase
          .from("news_cache")
          .select("*")
          .order("published_at", { ascending: false })
          .limit(8);

        if (typeof window !== "undefined") {
          // eslint-disable-next-line no-console
          console.log("NEWS_CACHE_FALLBACK_SELECT", data);
        }

        if (data && data.length > 0) {
          setRows(
            data.map((item) => ({
              title: item.title,
              url: item.url,
              source: item.source,
              published_at: item.published_at,
            })),
          );
        }
      } catch (fallbackError) {
        console.warn("News cache fallback failed", fallbackError);
      }
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured() && typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.warn("CryptoNews cache disabled: configure Supabase to persist results.");
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = !rows && !err;
  const hasRows = (rows?.length ?? 0) > 0;

  const renderHeadlines = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-3.5 w-full rounded-full bg-slate-100/80 animate-pulse" />
          ))}
        </div>
      );
    }

    if (hasRows) {
      return rows?.map((item, index) => (
        <a
          key={`${item.url}-${index}`}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl border border-transparent px-3 py-2 text-sm text-slate-700 transition hover:border-indigo-100 hover:bg-indigo-50/40 hover:text-indigo-600"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">{item.title}</span>
            {item.source ? (
              <span className="text-[11px] uppercase tracking-wide text-slate-400">{item.source}</span>
            ) : null}
          </div>
        </a>
      ));
    }

    return <p className="text-sm text-slate-500">No AI-curated signals yet. Check back shortly.</p>;
  };

  return (
    <Card
      title="Crypto News · AI Signals"
      subtitle="Realtime feeds scored by the NOP AI engine"
      right={
        <Badge className="rounded-full border border-indigo-200 bg-indigo-50 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
          AI
        </Badge>
      }
    >
      <div className="space-y-2">{renderHeadlines()}</div>
        {err ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-700">
            <span className="font-semibold" title={err ?? undefined}>
              Temporarily unavailable. Retry.
            </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-amber-700 hover:bg-amber-100 hover:text-amber-900"
            onClick={load}
          >
            Retry
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
