import { getSupabase } from "@/lib/supabaseClient";

export type ReputationLeaderboardRow = {
  user_address: string;
  realized_pnl_usd: number;
  win_rate: number | null;
  total_positions: number;
  open_positions: number;
};

const FALLBACK_TOP_USERS: ReputationLeaderboardRow[] = [
  {
    user_address: "0x9d8a***alpha",
    realized_pnl_usd: 18450,
    win_rate: 68.5,
    total_positions: 42,
    open_positions: 3,
  },
  {
    user_address: "0x1be3***labs",
    realized_pnl_usd: 14280,
    win_rate: 61.2,
    total_positions: 37,
    open_positions: 5,
  },
  {
    user_address: "0xa32f***intel",
    realized_pnl_usd: 12940,
    win_rate: 72.4,
    total_positions: 29,
    open_positions: 2,
  },
  {
    user_address: "0x4c91***feeds",
    realized_pnl_usd: 11280,
    win_rate: 58.1,
    total_positions: 34,
    open_positions: 4,
  },
  {
    user_address: "0x6db0***boost",
    realized_pnl_usd: 9875,
    win_rate: 55.3,
    total_positions: 31,
    open_positions: 1,
  },
];

const takeFallback = (limit: number) => FALLBACK_TOP_USERS.slice(0, limit);

export async function fetchTopUsers(limit = 5): Promise<ReputationLeaderboardRow[]> {
  const sb = getSupabase();
  if (!sb) {
    return takeFallback(limit);
  }

  const { data, error } = await sb
    .from<ReputationLeaderboardRow>("reputation_scores")
    .select("user_address,realized_pnl_usd,win_rate,total_positions,open_positions")
    .order("realized_pnl_usd", { ascending: false })
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
  if (id.length <= 8) {
    return id;
  }
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}
