import { getSupabase, supabaseAdminHint } from "@/lib/supabaseClient";
import { mockPosts } from "@/lib/mock-api";
import { generateRefCode } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";
import type {
  FeedResponse,
  Post,
  PostComment,
  PostRatingSummary,
  PostViewerState,
} from "@/types/feed";

const DEFAULT_PAGE_SIZE = 10;

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type RatingRow = Database["public"]["Tables"]["ratings"]["Row"];
type LikeRow = Database["public"]["Tables"]["post_likes"]["Row"];
type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
type CommentRowWithProfile = CommentRow & { profiles: ProfileRow | null };

export type SupabasePostRow = Database["public"]["Tables"]["posts"]["Row"] & {
  profiles: ProfileRow | null;
  ratings: RatingRow[] | null;
  post_likes: LikeRow[] | null;
  comments: { count: number }[] | null;
};

export interface FeedQueryOptions {
  cursor?: string;
  limit?: number;
}

const aggregateCount = (bucket?: { count: number }[] | null) =>
  bucket && bucket.length > 0 && typeof bucket[0]?.count === "number"
    ? bucket[0].count
    : 0;

const safeDate = (value?: string | null) =>
  value && !Number.isNaN(Date.parse(value)) ? value : new Date().toISOString();

const shortId = (value: string) =>
  value.length > 8 ? `${value.slice(0, 4)}…${value.slice(-4)}` : value;

const parseMediaField = (value?: string | null): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((entry): entry is string => typeof entry === "string");
    }
  } catch {
    // value was not JSON encoded, treat as single URL
  }
  return value ? [value] : [];
};

const summarizeRatings = (ratings?: RatingRow[] | null): PostRatingSummary => {
  const list = ratings ?? [];
  if (list.length === 0) {
    return { average: 0, count: 0 };
  }
  const total = list.reduce((sum, entry) => sum + (entry.score ?? 0), 0);
  return { average: total / list.length, count: list.length };
};

const mapAuthor = (profile: ProfileRow | null, fallbackId: string) => {
  const username = profile?.username ?? shortId(fallbackId);
  return {
    username,
    displayName: profile?.username ?? username,
    avatar: profile?.avatar_url ?? undefined,
    score: Number(profile?.nop_points ?? 0),
    refCode: profile?.wallet_address ?? generateRefCode(fallbackId.length),
    verified: Boolean(profile?.is_admin),
  };
};

const mapCommentRow = (row: CommentRowWithProfile): PostComment => ({
  id: row.id.toString(),
  postId: row.post_id.toString(),
  text: row.text,
  createdAt: safeDate(row.created_at),
  author: {
    id: row.author_id,
    ...mapAuthor(row.profiles, row.author_id),
  },
});

export const mapSupabasePost = (
  row: SupabasePostRow,
  viewerId?: string | null,
): Post => {
  const images = parseMediaField(row.media_url);
  const ratingSummary = summarizeRatings(row.ratings);
  const likes = row.post_likes ?? [];
  const viewerState: PostViewerState = {
    liked: Boolean(viewerId && likes.some((like) => like.user_id === viewerId)),
    rating:
      row.ratings?.find((rating) => rating.rater_id === viewerId)?.score ?? null,
  };

  return {
    id: row.id?.toString() ?? crypto.randomUUID(),
    author: mapAuthor(row.profiles, row.author_id),
    content: row.text,
    images,
    attachments: images,
    score: row.ai_score ?? Math.round(ratingSummary.average * 10),
    createdAt: safeDate(row.created_at),
    contributedAmount: 0,
    tags: row.tags ?? [],
    aiSignal: row.ai_signal ?? undefined,
    aiVolatility: row.ai_volatility ?? undefined,
    aiMmActivity: row.ai_mm_activity ?? undefined,
    aiScore: row.ai_score ?? undefined,
    aiLastUpdatedAt: row.ai_last_updated_at ?? undefined,
    engagement: {
      upvotes: likes.length,
      comments: aggregateCount(row.comments),
      tips: 0,
      shares: 0,
    },
    ratingSummary,
    viewerState,
  };
};

const buildMockFeed = (): FeedResponse => ({
  items: mockPosts,
  nextCursor: undefined,
});

export const fetchFeed = async (
  options: FeedQueryOptions = {},
): Promise<FeedResponse> => {
  const { cursor, limit = DEFAULT_PAGE_SIZE } = options;
  const supabase = getSupabase();
  if (!supabase) {
    return buildMockFeed();
  }

  try {
    const auth = await supabase.auth.getUser();
    const viewerId = auth.data?.user?.id ?? null;

    let query = supabase
      .from("posts")
      .select(
        `
        id,
        author_id,
        text,
        media_url,
        tags,
        is_investable,
        invest_open,
        created_at,
        ai_signal,
        ai_volatility,
        ai_mm_activity,
        ai_score,
        ai_last_updated_at,
        profiles:author_id (
          id,
          username,
          avatar_url,
          nop_points,
          wallet_address,
          is_admin
        ),
        ratings(score, rater_id),
        post_likes(user_id),
        comments(count)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    const rows = (data ?? []) as SupabasePostRow[];
    const hasMore = rows.length > limit;
    const records = hasMore ? rows.slice(0, limit) : rows;
    const items = records.map((row) => mapSupabasePost(row, viewerId));
    const nextCursor = hasMore
      ? items[items.length - 1]?.createdAt
      : undefined;

    return { items, nextCursor };
  } catch (error) {
    console.warn("[feed] Supabase fetch failed, falling back to mock data", error);
    return buildMockFeed();
  }
};

const ensureSupabase = () => {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error(supabaseAdminHint);
  }
  return supabase;
};

const parsePostId = (id: string | number) => {
  const numeric = typeof id === "number" ? id : Number(id);
  if (!Number.isFinite(numeric)) {
    throw new Error("Bu gonderi henuz senkronize edilmedi.");
  }
  return numeric;
};

export const fetchPostComments = async (
  postId: string | number,
): Promise<PostComment[]> => {
  const supabase = ensureSupabase();
  const numericId = parsePostId(postId);

  const { data, error } = await supabase
    .from("comments")
    .select(
      `
        id,
        post_id,
        text,
        created_at,
        author_id,
        profiles:author_id (
          id,
          username,
          avatar_url,
          nop_points,
          wallet_address,
          is_admin
        )
      `,
    )
    .eq("post_id", numericId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as CommentRowWithProfile[];
  return rows.map(mapCommentRow);
};

export const createPostComment = async (
  postId: string | number,
  text: string,
): Promise<PostComment> => {
  const supabase = ensureSupabase();
  const auth = await supabase.auth.getUser();

  if (auth.error) {
    throw new Error(auth.error.message);
  }

  const user = auth.data?.user;
  if (!user) {
    throw new Error("Yorum yapmak icin lutfen giris yap.");
  }

  const numericId = parsePostId(postId);
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: numericId,
      author_id: user.id,
      text,
    })
    .select(
      `
        id,
        post_id,
        text,
        created_at,
        author_id,
        profiles:author_id (
          id,
          username,
          avatar_url,
          nop_points,
          wallet_address,
          is_admin
        )
      `,
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Yorum kaydedilemedi.");
  }

  return mapCommentRow(data as CommentRowWithProfile);
};

export const togglePostLike = async (
  postId: string | number,
  nextState: boolean,
): Promise<boolean> => {
  const supabase = ensureSupabase();
  const auth = await supabase.auth.getUser();

  if (auth.error) {
    throw new Error(auth.error.message);
  }

  const user = auth.data?.user;
  if (!user) {
    throw new Error("Begenmek icin lutfen giris yap.");
  }

  const numericId = parsePostId(postId);
  if (nextState) {
    const { error } = await supabase
      .from("post_likes")
      .insert({ post_id: numericId, user_id: user.id });

    if (error && error.code !== "23505") {
      throw new Error(error.message);
    }
    return true;
  }

  const { error } = await supabase
    .from("post_likes")
    .delete()
    .eq("post_id", numericId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  return false;
};
