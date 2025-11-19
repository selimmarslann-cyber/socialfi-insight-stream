import { apiClient } from "@/lib/axios";
import { supabase } from "@/lib/supabaseClient";
import type { Contribute } from "./types";

type RawContribute = Partial<Contribute> & {
  id: string;
  title: string;
};

const withPoolDefaults = (contribute: RawContribute): Contribute => {
  // Guard defaults to keep pool state predictable.
  return {
    ...contribute,
    poolEnabled: contribute.poolEnabled ?? false,
    contractPostId: contribute.contractPostId ?? null,
  };
};

export const mapContribute = (contribute: RawContribute): Contribute => withPoolDefaults(contribute);

export const mapContributeList = (items: RawContribute[]): Contribute[] => items.map(withPoolDefaults);

export const fetchContribute = async (id: string): Promise<Contribute> => {
  const { data } = await apiClient.get<RawContribute>(`/contributes/${id}`);
  return withPoolDefaults(data);
};

export const fetchContributes = async (): Promise<Contribute[]> => {
  const { data } = await apiClient.get<RawContribute[]>("/contributes");
  return mapContributeList(data);
};

export type ContributeWithStats = Contribute & {
  weeklyVolumeNop: number;
};

const getCreatedAtTimestamp = (item: Contribute): number => {
  const createdAt =
    (item as { createdAt?: string }).createdAt ??
    (item as { created_at?: string }).created_at;
  if (!createdAt) return 0;
  const date = new Date(createdAt);
  const ts = date.getTime();
  return Number.isFinite(ts) ? ts : 0;
};

const sortByWeeklyPopularity = (
  a: ContributeWithStats,
  b: ContributeWithStats,
) => {
  if (b.weeklyVolumeNop !== a.weeklyVolumeNop) {
    return b.weeklyVolumeNop - a.weeklyVolumeNop;
  }
  return getCreatedAtTimestamp(b) - getCreatedAtTimestamp(a);
};

export const fetchContributesWithStats = async (): Promise<
  ContributeWithStats[]
> => {
  const contributes = await fetchContributes();
  const enriched: ContributeWithStats[] = contributes.map((item) => ({
    ...item,
    weeklyVolumeNop: 0,
  }));

  const client = supabase;
  if (!client) {
    return enriched.sort(sortByWeeklyPopularity);
  }

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data, error } = await client
    .from("nop_trades")
    .select("post_id, amount_nop, executed_at")
    .gte("executed_at", since.toISOString());

  if (error) {
    console.warn("[contributes] Failed to fetch trade stats", error);
    return enriched.sort(sortByWeeklyPopularity);
  }

  const volumeByPost = new Map<number, number>();

  for (const trade of data ?? []) {
    const postId = Number(trade.post_id);
    if (!Number.isFinite(postId)) continue;
    const amount = Number(trade.amount_nop ?? 0);
    volumeByPost.set(postId, (volumeByPost.get(postId) ?? 0) + amount);
  }

  for (const item of enriched) {
    const postKey =
      typeof item.contractPostId === "number"
        ? item.contractPostId
        : Number.parseInt(item.id, 10);
    if (Number.isFinite(postKey)) {
      item.weeklyVolumeNop = volumeByPost.get(postKey) ?? 0;
    }
  }

  return enriched.sort(sortByWeeklyPopularity);
};

export const fetchWeeklyTrendingContributes = async (): Promise<
  ContributeWithStats[]
> => {
  const all = await fetchContributesWithStats();
  const since = new Date();
  since.setDate(since.getDate() - 7);

  // Filter to only includes contributes from the last 7 days
  const weekly = all.filter((item) => {
    const createdAt =
      (item as { createdAt?: string }).createdAt ??
      (item as { created_at?: string }).created_at;
    if (!createdAt) return false;
    const created = new Date(createdAt);
    return created >= since;
  });

  // If we have weekly volume data, use it; otherwise fall back to like counts
  const client = supabase;
  if (client && weekly.length > 0) {
    const postIds = weekly
      .map((item) => {
        const postKey =
          typeof item.contractPostId === "number"
            ? item.contractPostId
            : Number.parseInt(item.id, 10);
        return Number.isFinite(postKey) ? postKey : null;
      })
      .filter((id): id is number => id !== null);

    if (postIds.length > 0) {
      const { data: likes } = await client
        .from("post_likes")
        .select("post_id")
        .in("post_id", postIds);

      const likeCounts = new Map<number, number>();
      likes?.forEach((like) => {
        const postId = Number(like.post_id);
        if (Number.isFinite(postId)) {
          likeCounts.set(postId, (likeCounts.get(postId) ?? 0) + 1);
        }
      });

      // Enhance with like counts if volume is 0
      weekly.forEach((item) => {
        const postKey =
          typeof item.contractPostId === "number"
            ? item.contractPostId
            : Number.parseInt(item.id, 10);
        if (Number.isFinite(postKey) && item.weeklyVolumeNop === 0) {
          const likes = likeCounts.get(postKey) ?? 0;
          // Use likes as a tiebreaker/boost for weekly trending
          item.weeklyScore = (item.weeklyScore ?? 0) + likes;
        }
      });
    }
  }

  // Sort by weekly volume first, then by weekly score (which includes likes), then by recency
  return weekly.sort((a, b) => {
    if (b.weeklyVolumeNop !== a.weeklyVolumeNop) {
      return b.weeklyVolumeNop - a.weeklyVolumeNop;
    }
    const aScore = (a as { weeklyScore?: number }).weeklyScore ?? 0;
    const bScore = (b as { weeklyScore?: number }).weeklyScore ?? 0;
    if (bScore !== aScore) {
      return bScore - aScore;
    }
    return getCreatedAtTimestamp(b) - getCreatedAtTimestamp(a);
  });
};
