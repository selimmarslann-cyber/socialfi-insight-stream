import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { fetchRssFeed } from "@/lib/rss";
import { supabase } from "@/lib/supabaseClient";

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

      if (data.length > 0) {
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
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!rows && !err) {
    return <Card title="Crypto News" subtitle="Loading..." />;
  }

  if (err && (!rows || rows.length === 0)) {
    return (
      <Card title="Crypto News" error="Temporarily unavailable. Retry." onRetry={load} />
    );
  }

  return (
    <Card title="Crypto News">
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
