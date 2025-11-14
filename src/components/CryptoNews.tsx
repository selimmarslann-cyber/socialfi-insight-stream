import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { fetchRssFeed } from "@/lib/rss";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { readNewsConfig } from "@/lib/safeEnv";

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

  if (!rows && (isLoading || !err)) {
    return <Card title="Crypto News" subtitle="Loading…" />;
  }

  if (err && (!rows || rows.length === 0)) {
    return (
      <Card
        title="Crypto News"
        error={err}
        onRetry={
          feedsMissing
            ? undefined
            : () => {
                void load();
              }
        }
      />
    );
  }

  return (
    <Card
      title="Crypto News"
      right={
        err ? (
          <button
            type="button"
            onClick={() => {
              if (!feedsMissing) {
                void load();
              }
            }}
            className="text-xs font-semibold text-indigo-600 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            disabled={feedsMissing}
          >
            Retry
          </button>
        ) : undefined
      }
    >
      {rows?.map((item, index) => (
        <a
          key={`${item.url}-${index}`}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="block py-2 text-sm text-slate-700 transition hover:text-indigo-600 hover:underline"
        >
          {item.title}
        </a>
      ))}
    </Card>
  );
}
