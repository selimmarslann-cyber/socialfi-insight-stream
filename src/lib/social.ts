import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/lib/supabaseClient";
import { generateRefCode } from "@/lib/utils";
import { mockPosts } from "@/lib/mock-api";
import type { Post, PostComment, CreatePostInput } from "@/types/feed";

type SocialPostRow = Tables<"social_posts">;
type SocialLikeRow = Tables<"social_likes">;
type SocialCommentRow = Tables<"social_comments">;
type SocialProfileRow = Tables<"social_profiles">;

const FALLBACK_POST_LIMIT = 20;

const sanitizeWallet = (address?: string | null) => address?.toLowerCase() ?? "";
const formatWallet = (address?: string | null) =>
  address && address.length > 10 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address ?? "Anon";

const buildRefCodeSeed = (address: string) => {
  const slice = address.replace(/^0x/i, "").slice(-5);
  const numeric = Number.parseInt(slice || "0", 16);
  return Number.isNaN(numeric) ? undefined : numeric;
};

const mapComments = (rows: SocialCommentRow[]): Map<number, PostComment[]> => {
  const map = new Map<number, PostComment[]>();
  rows.forEach((row) => {
    const comment: PostComment = {
      id: row.id.toString(),
      postId: row.post_id.toString(),
      walletAddress: row.wallet_address,
      content: row.content,
      createdAt: row.created_at ?? new Date().toISOString(),
    };
    const existing = map.get(row.post_id) ?? [];
    existing.push(comment);
    map.set(row.post_id, existing);
  });
  return map;
};

const mapLikes = (rows: SocialLikeRow[]): Map<number, SocialLikeRow[]> => {
  const map = new Map<number, SocialLikeRow[]>();
  rows.forEach((row) => {
    const existing = map.get(row.post_id) ?? [];
    existing.push(row);
    map.set(row.post_id, existing);
  });
  return map;
};

const mapPostRow = (
  row: SocialPostRow,
  opts: {
    likes: Map<number, SocialLikeRow[]>;
    comments: Map<number, PostComment[]>;
    viewer?: string;
  },
): Post => {
  const wallet = sanitizeWallet(row.wallet_address);
  const likes = opts.likes.get(row.id) ?? [];
  const comments = opts.comments.get(row.id) ?? [];
  const likedByViewer = opts.viewer ? likes.some((like) => sanitizeWallet(like.wallet_address) === opts.viewer) : false;
  const displayName = row.author_name?.trim() || formatWallet(row.wallet_address);
  const username = row.author_name?.replace(/\s+/g, "-").toLowerCase() || wallet.slice(-8);

  return {
    id: row.id.toString(),
    walletAddress: row.wallet_address,
    author: {
      username,
      displayName,
      avatar: row.author_avatar_url ?? undefined,
      score: 0,
      refCode: generateRefCode(buildRefCodeSeed(wallet)),
      verified: false,
    },
    content: row.content,
    images: row.media_urls ?? undefined,
    attachments: row.media_urls ?? undefined,
    score: 0,
    createdAt: row.created_at ?? new Date().toISOString(),
    contributedAmount: 0,
    tags: row.tags ?? undefined,
    poolEnabled: row.pool_enabled ?? false,
    contractPostId: row.contract_post_id ?? null,
    likedByViewer,
    comments: comments.slice(-3),
    engagement: {
      upvotes: likes.length,
      comments: comments.length,
      tips: 0,
      shares: 0,
    },
  };
};

const uniqueById = (posts: Post[]): Post[] => {
  const seen = new Set<string>();
  return posts.filter((post) => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });
};

export type FetchSocialFeedOptions = {
  limit?: number;
  viewerWallet?: string;
  authorWallet?: string;
};

export async function ensureSocialProfile(input: {
  walletAddress: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}): Promise<SocialProfileRow | null> {
  const client = supabase;
  if (!client || !input.walletAddress) {
    return null;
  }
  const normalized = sanitizeWallet(input.walletAddress);
  const payload = {
    wallet_address: normalized,
    display_name: input.displayName ?? formatWallet(input.walletAddress),
    avatar_url: input.avatarUrl ?? null,
    bio: input.bio ?? null,
  };
  const { data, error } = await client
    .from("social_profiles")
    .upsert(payload, { onConflict: "wallet_address" })
    .select("*")
    .single();
  if (error) {
    console.warn("[social] Failed to upsert profile", error);
    return null;
  }
  return data;
}

export async function fetchSocialProfile(walletAddress: string): Promise<SocialProfileRow | null> {
  const client = supabase;
  if (!client || !walletAddress) return null;
  const normalized = sanitizeWallet(walletAddress);
  const { data, error } = await client
    .from("social_profiles")
    .select("*")
    .eq("wallet_address", normalized)
    .maybeSingle();
  if (error) {
    console.warn("[social] Failed to fetch profile", error);
    return null;
  }
  if (data) {
    return data;
  }
  return ensureSocialProfile({ walletAddress: normalized });
}

export async function fetchSocialFeed(options: FetchSocialFeedOptions = {}): Promise<Post[]> {
  const client = supabase;
  const viewer = sanitizeWallet(options.viewerWallet);
  const limit = options.limit ?? FALLBACK_POST_LIMIT;
  if (!client) {
    return mockPosts;
  }
  try {
    let query = client
      .from("social_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (options.authorWallet) {
      query = query.eq("wallet_address", sanitizeWallet(options.authorWallet));
    }
    const { data, error } = await query;
    if (error || !data) {
      throw error ?? new Error("social_posts_empty");
    }
    const postIds = data.map((row) => row.id);
    if (postIds.length === 0) {
      return mockPosts;
    }
    const [likesRes, commentsRes] = await Promise.all([
      client.from("social_likes").select("*").in("post_id", postIds),
      client
        .from("social_comments")
        .select("*")
        .in("post_id", postIds)
        .order("created_at", { ascending: true }),
    ]);
    const likes = likesRes.data ?? [];
    const comments = commentsRes.data ?? [];
    const likesByPost = mapLikes(likes);
    const commentsByPost = mapComments(comments);
    const posts = data.map((row) => mapPostRow(row, { likes: likesByPost, comments: commentsByPost, viewer }));
    const fallback = posts.length === 0 ? mockPosts : [];
    return uniqueById([...posts, ...fallback]);
  } catch (error) {
    console.warn("[social] Falling back to mock feed", error);
    return mockPosts;
  }
}

export async function createSocialPost(input: CreatePostInput): Promise<Post> {
  const client = supabase;
  const walletAddress = sanitizeWallet(input.walletAddress);
  if (!client) {
    const fallback = mockPosts[0];
    return {
      ...fallback,
      id: `local-${Date.now()}`,
      content: input.content,
      walletAddress,
      createdAt: new Date().toISOString(),
    };
  }
  const payload = {
    wallet_address: walletAddress,
    content: input.content,
    media_urls: input.mediaUrls?.length ? input.mediaUrls : null,
    tags: input.tags?.length ? input.tags : null,
    pool_enabled: false,
  };
  const { data, error } = await client.from("social_posts").insert(payload).select("*").single();
  if (error || !data) {
    throw new Error(error?.message ?? "Unable to publish contribution");
  }
  await ensureSocialProfile({ walletAddress });
  return mapPostRow(data, { likes: new Map(), comments: new Map(), viewer: walletAddress });
}

export async function togglePostLike(postId: number, walletAddress: string): Promise<{
  liked: boolean;
}> {
  const client = supabase;
  if (!client) {
    return { liked: false };
  }
  const normalized = sanitizeWallet(walletAddress);
  const { data: existing } = await client
    .from("social_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("wallet_address", normalized)
    .maybeSingle();
  if (existing) {
    await client.from("social_likes").delete().eq("post_id", postId).eq("wallet_address", normalized);
    return { liked: false };
  }
  await client.from("social_likes").insert({ post_id: postId, wallet_address: normalized });
  return { liked: true };
}

export async function createPostComment({
  postId,
  walletAddress,
  content,
}: {
  postId: number;
  walletAddress: string;
  content: string;
}): Promise<PostComment | null> {
  const client = supabase;
  if (!client) return null;
  const normalized = sanitizeWallet(walletAddress);
  const { data, error } = await client
    .from("social_comments")
    .insert({
      post_id: postId,
      wallet_address: normalized,
      content,
    })
    .select("*")
    .single();
  if (error || !data) {
    console.warn("[social] Failed to create comment", error);
    return null;
  }
  return {
    id: data.id.toString(),
    postId: data.post_id.toString(),
    walletAddress: data.wallet_address,
    content: data.content,
    createdAt: data.created_at ?? new Date().toISOString(),
  };
}
