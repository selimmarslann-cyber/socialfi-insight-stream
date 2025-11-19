import { supabase } from "@/lib/supabaseClient";

export type SharePlatform = "twitter" | "telegram" | "link" | "qr";

export type Share = {
  id: string;
  sharer_address: string;
  contribute_id: string;
  platform: SharePlatform;
  created_at: string;
};

/**
 * Track a share event
 */
export async function trackShare(params: {
  sharerAddress: string;
  contributeId: string;
  platform: SharePlatform;
}): Promise<boolean> {
  const client = supabase;
  if (!client) return false;

  try {
    const { error } = await client
      .from("shares")
      .insert({
        sharer_address: params.sharerAddress.toLowerCase(),
        contribute_id: params.contributeId,
        platform: params.platform,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.warn("[share] Failed to track share", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[share] Error tracking share", error);
    return false;
  }
}

/**
 * Get share count for a contribute
 */
export async function getShareCount(contributeId: string): Promise<number> {
  const client = supabase;
  if (!client) return 0;

  try {
    const { count, error } = await client
      .from("shares")
      .select("*", { count: "exact", head: true })
      .eq("contribute_id", contributeId);

    if (error) {
      console.warn("[share] Failed to get share count", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("[share] Error getting share count", error);
    return 0;
  }
}

