import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { fetchRssFeed } from "@/lib/rss";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { readNewsConfig } from "@/lib/safeEnv";
import { Badge } from "@/components/ui/badge";

type NewsRow = {
  title: string;
  url: string;
  source?: string;
  published_at?: string;
};

const { rssList } = readNewsConfig();
const FEEDS = rssList ?? "";

export default function CryptoNews() {
  const [rows, setRows] = useState<NewsRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const feedsMissing = FEEDS.length === 0;

  useEffect(() => {
    if (feedsMissing) {
      setErr("News feed list missing. Set NEXT_PUBLIC_NEWS_RSS.");
    }
  }, [feedsMissing]);

  const load = async () => {
    if (feedsMissing) {
      return;
    }

    setErr(null);
    setIsLoading(true);

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

        await supabase.from("news_cache").insert(payload).select("id").limit(1);
      }
    } catch (error) {
      console.warn("Crypto news fetch failed", error);
      const message =
        (error as { message?: string } | null)?.message ||
        "Feed temporarily unavailable. Retry.";
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured() && typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.warn(
        "CryptoNews cache disabled: configure Supabase to persist results.",
      );
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasRows = Boolean(rows && rows.length > 0);
  const showLoadingState = isLoading && !hasRows;

  return (
    <Card
      title="Crypto News · AI Signals"
      right={
        <Badge className="rounded-full bg-indigo-50 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
          AI
        </Badge>
      }
    >
      <div className="space-y-2 text-sm text-slate-700">
        {showLoadingState && (
          <div className="h-24 w-full rounded-xl bg-slate-100/80 animate-pulse" />
        )}

        {hasRows &&
          rows?.map((item, index) => (
            <a
              key={`${item.url}-${index}`}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl border border-transparent px-3 py-2 text-sm text-slate-700 transition hover:border-indigo-100 hover:text-indigo-600"
            >
              {item.title}
            </a>
          ))}

        {!hasRows && !showLoadingState && (
          <div className="rounded-xl border border-dashed border-indigo-200/70 bg-indigo-50/40 px-3 py-2 text-xs text-slate-500">
            AI-curated headlines will populate once the feed refreshes.
          </div>
        )}
      </div>

      {err && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-800">
          <span>{err || "Temporarily unavailable. Retry."}</span>
          <button
            type="button"
            onClick={() => {
              if (!feedsMissing) {
                void load();
              }
            }}
            className="rounded-full border border-amber-300 px-3 py-1 text-[11px] font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={feedsMissing}
          >
            Retry
          </button>
        </div>
      )}
    </Card>
  );
}
