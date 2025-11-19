import { supabase } from "@/lib/supabaseClient";
import { useWalletStore } from "@/lib/store";
import {
  ensureProfileForWallet,
  getProfileByWallet,
  isProfileBanned,
  type Profile,
} from "@/lib/profile";

const sanitizePostId = (postId: string | number): number => {
  const numeric = typeof postId === "string" ? Number(postId) : postId;
  if (!Number.isFinite(numeric)) {
    throw new Error("Invalid post id");
  }
  return numeric;
};

const getConnectedWallet = () => useWalletStore.getState().address ?? null;

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }
  return supabase;
};

const ensureActiveProfile = async (): Promise<Profile> => {
  const wallet = getConnectedWallet();
  if (!wallet) {
    throw new Error("Connect your wallet first");
  }
  const profile = await ensureProfileForWallet(wallet);
  if (isProfileBanned(profile)) {
    throw new Error("Your account is currently restricted");
  }
  return profile;
};

export async function toggleLike(postId: string | number): Promise<{ liked: boolean; total: number }> {
  const client = requireSupabase();
  const profile = await ensureActiveProfile();
  const numericPostId = sanitizePostId(postId);
  const { data: existing, error: fetchError } = await client
    .from("post_likes")
    .select("id")
    .eq("post_id", numericPostId)
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (fetchError) {
    throw fetchError;
  }
  if (existing) {
    const { error } = await client
      .from("post_likes")
      .delete()
      .eq("post_id", numericPostId)
      .eq("profile_id", profile.id);
    if (error) throw error;
    const total = await getPostLikeCount(numericPostId);
    return { liked: false, total };
  }
  const { error } = await client.from("post_likes").insert({
    post_id: numericPostId,
    profile_id: profile.id,
    wallet_address: profile.wallet_address,
  });
  if (error) {
    throw error;
  }
  const total = await getPostLikeCount(numericPostId);
  return { liked: true, total };
}

export async function isPostLikedByCurrentUser(postId: string | number): Promise<boolean> {
  const client = supabase;
  if (!client) {
    return false;
  }
  const wallet = getConnectedWallet();
  if (!wallet) return false;
  const profile = await getProfileByWallet(wallet);
  if (!profile) return false;
  const numericPostId = sanitizePostId(postId);
  const { data, error } = await client
    .from("post_likes")
    .select("id")
    .eq("post_id", numericPostId)
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (error) {
    console.warn("[likes] unable to resolve liked state", error);
    return false;
  }
  return Boolean(data);
}

export async function getPostLikeCount(postId: string | number): Promise<number> {
  const client = supabase;
  if (!client) {
    return 0;
  }
  const numericPostId = sanitizePostId(postId);
  const { count, error } = await client
    .from("post_likes")
    .select("id", { count: "exact", head: true })
    .eq("post_id", numericPostId);
  if (error) {
    console.warn("[likes] unable to fetch like count", error);
    return 0;
  }
  return count ?? 0;
}
