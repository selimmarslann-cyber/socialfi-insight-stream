import { getSupabase } from "@/lib/supabaseClient";
import type { CreatePostInput, Post } from "@/types/feed";
import { mapSupabasePost, type SupabasePostRow } from "@/lib/feed-service";

const POST_SELECT = `
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
`;

export async function createPost(input: CreatePostInput): Promise<Post> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase yapılandırılmadı.");
  }
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  const user = authData.user;
  if (!user) {
    throw new Error("Please sign in first.");
  }

  const { content, attachments, tags } = input;
  const payload = {
    text: content,
    author_id: user.id,
    media_url:
      attachments && attachments.length > 0 ? JSON.stringify(attachments) : null,
    tags: tags && tags.length > 0 ? tags : null,
  };

  const { data, error } = await supabase
    .from("posts")
    .insert(payload)
    .select(POST_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Post kaydedilemedi.");
  }

  return mapSupabasePost(data as SupabasePostRow, user.id);
}

export async function ratePost(postId: string | number, score: number) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase yapılandırılmadı.");
  }
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  const user = authData.user;
  if (!user) {
    throw new Error("Please sign in first.");
  }

  const numericId =
    typeof postId === "number" ? postId : Number.parseInt(postId as string, 10);
  if (!Number.isFinite(numericId)) {
    throw new Error("Bu gönderi henüz test modunda, puanlanamaz.");
  }

  const { data, error } = await supabase
    .from("ratings")
    .upsert({ post_id: numericId, rater_id: user.id, score })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
