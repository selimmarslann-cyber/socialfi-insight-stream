import { getSupabase } from "@/lib/supabaseClient";

export type Period = "daily" | "weekly" | "total";

export type LeaderboardRow = {
  user_id: string;
  total_score: number | null;
  daily_score: number | null;
  weekly_score: number | null;
  profiles?: {
    username?: string | null;
  } | null;
};

const FALLBACK_TOP_USERS: LeaderboardRow[] = [
  {
    user_id: "mock-signalqueen",
    total_score: 48200,
    weekly_score: 18950,
    daily_score: 920,
    profiles: { username: "signalqueen" },
  },
  {
    user_id: "mock-layer2labs",
    total_score: 45120,
    weekly_score: 17540,
    daily_score: 860,
    profiles: { username: "layer2labs" },
  },
  {
    user_id: "mock-yieldsmith",
    total_score: 42990,
    weekly_score: 16220,
    daily_score: 740,
    profiles: { username: "yieldsmith" },
  },
  {
    user_id: "mock-airdropalpha",
    total_score: 40750,
    weekly_score: 14980,
    daily_score: 610,
    profiles: { username: "airdropalpha" },
  },
  {
    user_id: "mock-nopwhale",
    total_score: 39810,
    weekly_score: 13740,
    daily_score: 520,
    profiles: { username: "nopwhale" },
  },
];

const takeFallback = (limit: number) => FALLBACK_TOP_USERS.slice(0, limit);

export async function fetchTopUsers(
  period: Period,
  limit = 5,
): Promise<LeaderboardRow[]> {
  const sb = getSupabase();
  const col =
    period === "daily"
      ? "daily_score"
      : period === "weekly"
        ? "weekly_score"
        : "total_score";

  if (!sb) {
    return takeFallback(limit);
  }

  const { data, error } = await sb
    .from<LeaderboardRow>("gaming_scores")
    .select(
      "user_id,total_score,daily_score,weekly_score,profiles(username)",
    )
    .order(col, { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[leaderboard] fetch failed", error.message);
    return takeFallback(limit);
  }

  if (!data || data.length === 0) {
    return takeFallback(limit);
  }

  return data;
}

export function shortId(id: string) {
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}
