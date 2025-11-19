import { supabase } from "@/lib/supabaseClient";

export type Follow = {
  id: string;
  follower_address: string;
  following_address: string;
  created_at: string;
};

/**
 * Follow a creator
 */
export async function followCreator(
  followerAddress: string,
  followingAddress: string
): Promise<boolean> {
  const client = supabase;
  if (!client) return false;

  try {
    const { error } = await client
      .from("follows")
      .insert({
        follower_address: followerAddress.toLowerCase(),
        following_address: followingAddress.toLowerCase(),
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.warn("[follow] Failed to follow creator", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[follow] Error following creator", error);
    return false;
  }
}

/**
 * Unfollow a creator
 */
export async function unfollowCreator(
  followerAddress: string,
  followingAddress: string
): Promise<boolean> {
  const client = supabase;
  if (!client) return false;

  try {
    const { error } = await client
      .from("follows")
      .delete()
      .eq("follower_address", followerAddress.toLowerCase())
      .eq("following_address", followingAddress.toLowerCase());

    if (error) {
      console.warn("[follow] Failed to unfollow creator", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[follow] Error unfollowing creator", error);
    return false;
  }
}

/**
 * Check if user is following a creator
 */
export async function isFollowing(
  followerAddress: string,
  followingAddress: string
): Promise<boolean> {
  const client = supabase;
  if (!client) return false;

  try {
    const { data, error } = await client
      .from("follows")
      .select("id")
      .eq("follower_address", followerAddress.toLowerCase())
      .eq("following_address", followingAddress.toLowerCase())
      .maybeSingle();

    if (error) {
      console.warn("[follow] Failed to check follow status", error);
      return false;
    }

    return Boolean(data);
  } catch (error) {
    console.error("[follow] Error checking follow status", error);
    return false;
  }
}

/**
 * Get followers count for a creator
 */
export async function getFollowersCount(creatorAddress: string): Promise<number> {
  const client = supabase;
  if (!client) return 0;

  try {
    const { count, error } = await client
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_address", creatorAddress.toLowerCase());

    if (error) {
      console.warn("[follow] Failed to get followers count", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("[follow] Error getting followers count", error);
    return 0;
  }
}

/**
 * Get following count for a user
 */
export async function getFollowingCount(userAddress: string): Promise<number> {
  const client = supabase;
  if (!client) return 0;

  try {
    const { count, error } = await client
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_address", userAddress.toLowerCase());

    if (error) {
      console.warn("[follow] Failed to get following count", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("[follow] Error getting following count", error);
    return 0;
  }
}

/**
 * Get list of creators user is following
 */
export async function getFollowingList(userAddress: string): Promise<string[]> {
  const client = supabase;
  if (!client) return [];

  try {
    const { data, error } = await client
      .from("follows")
      .select("following_address")
      .eq("follower_address", userAddress.toLowerCase());

    if (error) {
      console.warn("[follow] Failed to get following list", error);
      return [];
    }

    return (data || []).map((f) => f.following_address);
  } catch (error) {
    console.error("[follow] Error getting following list", error);
    return [];
  }
}

