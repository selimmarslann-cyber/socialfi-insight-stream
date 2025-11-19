import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/lib/supabaseClient";
import { generateRefCode } from "@/lib/utils";
import { mockPosts } from "@/lib/mock-api";
import type { Post, PostComment, CreatePostInput } from "@/types/feed";
import { ensureProfileForWallet, getProfileByWallet } from "@/lib/profile";

type SocialPostRow = Tables<"social_posts">;
type SocialLikeRow = Tables<"post_likes">;
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
    verifiedProfiles?: Map<string, boolean>;
  },
): Post => {
  const wallet = sanitizeWallet(row.wallet_address);
  const likes = opts.likes.get(row.id) ?? [];
  const comments = opts.comments.get(row.id) ?? [];
  const likedByViewer = opts.viewer ? likes.some((like) => sanitizeWallet(like.wallet_address) === opts.viewer) : false;
  const displayName = row.author_name?.trim() || formatWallet(row.wallet_address);
  const username = row.author_name?.replace(/\s+/g, "-").toLowerCase() || wallet.slice(-8);

  // Get verified status from pre-fetched map
  const isVerified = row.author_profile_id
    ? opts.verifiedProfiles?.get(row.author_profile_id) ?? false
    : false;

  return {
    id: row.id.toString(),
    walletAddress: row.wallet_address,
    author: {
      username,
      displayName,
      avatar: row.author_avatar_url ?? undefined,
      score: 0,
      refCode: generateRefCode(buildRefCodeSeed(wallet)),
      verified: isVerified,
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
    sentimentScore: row.sentiment_score ? Number(row.sentiment_score) : undefined,
    sentimentLabel: row.sentiment_label as "bearish" | "neutral" | "bullish" | undefined,
    sentimentConfidence: row.sentiment_confidence ? Number(row.sentiment_confidence) : undefined,
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

const hydratePosts = async (rows: SocialPostRow[], viewer: string): Promise<Post[]> => {
  if (!supabase) {
    return [];
  }
  if (rows.length === 0) {
    return [];
  }
  const postIds = rows.map((row) => row.id);
  const profileIds = [...new Set(rows.map((row) => row.author_profile_id).filter((id): id is string => Boolean(id)))];
  
  const [likesRes, commentsRes, profilesRes] = await Promise.all([
    supabase.from("post_likes").select("*").in("post_id", postIds),
    supabase
      .from("social_comments")
      .select("*")
      .in("post_id", postIds)
      .order("created_at", { ascending: true }),
    profileIds.length > 0
      ? supabase
          .from("social_profiles")
          .select("id, is_verified")
          .in("id", profileIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const likes = likesRes.data ?? [];
  const comments = commentsRes.data ?? [];
  const profiles = profilesRes.data ?? [];
  
  const verifiedProfiles = new Map<string, boolean>();
  profiles.forEach((profile) => {
    if (profile.id) {
      verifiedProfiles.set(profile.id, profile.is_verified ?? false);
    }
  });
  
  const likesByPost = mapLikes(likes);
  const commentsByPost = mapComments(comments);
  return rows.map((row) => mapPostRow(row, { likes: likesByPost, comments: commentsByPost, viewer, verifiedProfiles }));
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
  includeHidden?: boolean;
  featuredOnly?: boolean;
};

export async function fetchSocialProfile(walletAddress: string): Promise<SocialProfileRow | null> {
  const client = supabase;
  if (!client || !walletAddress) return null;
  const normalized = sanitizeWallet(walletAddress);
  const existing = await getProfileByWallet(normalized);
  if (existing) {
    return existing as SocialProfileRow;
  }
  return ensureProfileForWallet(normalized);
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
    if (!options.includeHidden) {
      query = query.eq("is_hidden", false);
    }
    if (options.featuredOnly) {
      query = query.eq("is_featured", true);
    }
    if (options.authorWallet) {
      query = query.eq("wallet_address", sanitizeWallet(options.authorWallet));
    }
    const { data, error } = await query;
    if (error || !data) {
      throw error ?? new Error("social_posts_empty");
    }
    
    // Filter out posts from banned users
    const walletAddresses = [...new Set(data.map((row) => sanitizeWallet(row.wallet_address)).filter(Boolean))];
    const profileIds = [...new Set(data.map((row) => row.author_profile_id).filter((id): id is string => Boolean(id)))];
    
    let bannedWallets = new Set<string>();
    let bannedProfileIds = new Set<string>();
    
    if (walletAddresses.length > 0 || profileIds.length > 0) {
      const queries = [];
      if (walletAddresses.length > 0) {
        queries.push(
          client
            .from("social_profiles")
            .select("wallet_address, id, is_banned")
            .in("wallet_address", walletAddresses)
        );
      }
      if (profileIds.length > 0) {
        queries.push(
          client
            .from("social_profiles")
            .select("id, is_banned")
            .in("id", profileIds)
        );
      }
      
      const results = await Promise.all(queries);
      results.forEach((result) => {
        result.data?.forEach((profile) => {
          if (profile.is_banned) {
            if (profile.id) {
              bannedProfileIds.add(profile.id);
            }
            if (profile.wallet_address) {
              bannedWallets.add(sanitizeWallet(profile.wallet_address));
            }
          }
        });
      });
    }
    
    const filteredData = data.filter((row) => {
      if (row.author_profile_id && bannedProfileIds.has(row.author_profile_id)) {
        return false;
      }
      const wallet = sanitizeWallet(row.wallet_address);
      if (bannedWallets.has(wallet)) {
        return false;
      }
      return true;
    });
    
    const posts = await hydratePosts(filteredData, viewer);
    const fallback = posts.length === 0 ? mockPosts : [];
    return uniqueById([...posts, ...fallback]);
  } catch (error) {
    console.warn("[social] Falling back to mock feed", error);
    return mockPosts;
  }
}

export async function fetchPostsByIds(
  postIds: number[],
  viewerWallet?: string,
  options?: { includeHidden?: boolean },
): Promise<Post[]> {
  const client = supabase;
  if (!client || postIds.length === 0) {
    return [];
  }
  const viewer = sanitizeWallet(viewerWallet);
  try {
    let query = client.from("social_posts").select("*").in("id", postIds);
    if (!options?.includeHidden) {
      query = query.eq("is_hidden", false);
    }
    const { data, error } = await query;
    if (error || !data) {
      throw error ?? new Error("posts_by_ids_empty");
    }
    const posts = await hydratePosts(data, viewer);
    const order = new Map(postIds.map((id, index) => [id, index]));
    return posts.sort((a, b) => {
      const aIndex = order.get(Number(a.id)) ?? 0;
      const bIndex = order.get(Number(b.id)) ?? 0;
      return aIndex - bIndex;
    });
  } catch (error) {
    console.warn("[social] Failed to fetch posts by ids", error);
    return [];
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
  if (!walletAddress) {
    throw new Error("Wallet address is required to publish");
  }
  const profile = await ensureProfileForWallet(walletAddress);
  const payload = {
    wallet_address: walletAddress,
    author_profile_id: profile.id,
    author_name: profile.display_name ?? formatWallet(walletAddress),
    author_avatar_url: profile.avatar_url,
    content: input.content,
    media_urls: input.mediaUrls?.length ? input.mediaUrls : null,
    tags: input.tags?.length ? input.tags : null,
    pool_enabled: false,
  };
  const { data, error } = await client.from("social_posts").insert(payload).select("*").single();
  if (error || !data) {
    throw new Error(error?.message ?? "Unable to publish contribution");
  }
  // Fetch profile for verified status
  const verifiedProfiles = new Map<string, boolean>();
  if (data.author_profile_id) {
    const { data: profile } = await client
      .from("social_profiles")
      .select("is_verified")
      .eq("id", data.author_profile_id)
      .maybeSingle();
    if (profile) {
      verifiedProfiles.set(data.author_profile_id, profile.is_verified ?? false);
    }
  }
  return mapPostRow(data, { likes: new Map(), comments: new Map(), viewer: walletAddress, verifiedProfiles });
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
