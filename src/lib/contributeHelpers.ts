import { apiClient } from "@/lib/axios";
import { supabase } from "@/lib/supabaseClient";
import type { Contribute } from "./types";

/**
 * Get contribute by contractPostId
 */
export async function getContributeByPostId(contractPostId: number): Promise<Contribute | null> {
  try {
    // Try API first
    const { data } = await apiClient.get<Contribute[]>(`/contributes?contractPostId=${contractPostId}`);
    if (data && data.length > 0) {
      return data[0];
    }
  } catch (error) {
    console.warn("[contributeHelpers] API fetch failed", error);
  }

  // Fallback: Try to find in Supabase (if contributes table exists)
  const client = supabase;
  if (client) {
    try {
      const { data } = await client
        .from("contributes")
        .select("*")
        .eq("contract_post_id", contractPostId)
        .single();
      
      if (data) {
        return {
          id: data.id,
          title: data.title || "",
          subtitle: data.subtitle,
          description: data.description,
          author: data.author,
          tags: data.tags,
          poolEnabled: data.pool_enabled,
          contractPostId: data.contract_post_id,
        };
      }
    } catch (error) {
      console.warn("[contributeHelpers] Supabase fetch failed", error);
    }
  }

  return null;
}

/**
 * Get contribute author wallet address
 */
export async function getContributeAuthor(postId: number): Promise<string | null> {
  const contribute = await getContributeByPostId(postId);
  if (!contribute || !contribute.author) {
    return null;
  }
  
  // Author might be wallet address or username
  // If it's a wallet address (starts with 0x), return it
  if (contribute.author.startsWith("0x")) {
    return contribute.author.toLowerCase();
  }
  
  // Otherwise, try to find wallet from profile
  const client = supabase;
  if (client) {
    try {
      const { data } = await client
        .from("social_profiles")
        .select("wallet_address")
        .or(`username.eq.${contribute.author},handle.eq.${contribute.author}`)
        .single();
      
      return data?.wallet_address?.toLowerCase() || null;
    } catch (error) {
      console.warn("[contributeHelpers] Failed to find author wallet", error);
    }
  }
  
  return null;
}

/**
 * Get buyer count for a contribute (for early buyer bonus)
 */
export async function getBuyerCount(postId: number): Promise<number> {
  const client = supabase;
  if (!client) {
    return 0;
  }

  try {
    const { count } = await client
      .from("nop_trades")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId)
      .eq("side", "buy");
    
    return count || 0;
  } catch (error) {
    console.warn("[contributeHelpers] Failed to get buyer count", error);
    return 0;
  }
}

