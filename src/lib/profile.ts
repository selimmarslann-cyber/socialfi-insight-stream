import { supabase } from "@/lib/supabaseClient";
import { useWalletStore } from "@/lib/store";
import type { Tables } from "@/integrations/supabase/types";
import { fetchPostsByIds, fetchSocialFeed } from "@/lib/social";
import type { Post } from "@/types/feed";

export type Profile = Tables<"social_profiles">;

const AVATAR_BUCKET = "avatars";
const DEFAULT_DISPLAY_NAME = "Guest Analyst";

const sanitizeWallet = (value?: string | null) => value?.toLowerCase()?.trim() ?? "";

const resolveWalletOrThrow = () => {
  const wallet = useWalletStore.getState().address;
  const normalized = sanitizeWallet(wallet);
  if (!normalized) {
    throw new Error("Wallet not connected");
  }
  return normalized;
};

const randomSuffix = () => Math.random().toString(36).slice(-4);

const buildHandle = (wallet: string) => {
  const core = wallet.replace(/^0x/i, "").slice(0, 6) || randomSuffix();
  return `nop-${core}`.toLowerCase();
};

const buildNopId = (wallet: string) => {
  const core = wallet.replace(/^0x/i, "").slice(-6).toUpperCase() || randomSuffix().toUpperCase();
  return `NOP-${core}`;
};

const insertProfileRow = async (wallet: string, overrides?: Partial<Profile>) => {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }
  const payload = {
    wallet_address: wallet,
    display_name: overrides?.display_name ?? `${DEFAULT_DISPLAY_NAME} ${wallet.slice(-4)}`,
    handle: overrides?.handle ?? buildHandle(wallet),
    avatar_url: overrides?.avatar_url ?? null,
    bio: overrides?.bio ?? null,
    nop_id: overrides?.nop_id ?? buildNopId(wallet),
  };

  const { data, error } = await supabase.from("social_profiles").insert(payload).select("*").single();
  if (error && !error.message.includes("duplicate key value violates unique constraint")) {
    throw error;
  }
  if (data) return data as Profile;
  // Collision fallback
  const fallback = {
    ...payload,
    handle: `${payload.handle}-${randomSuffix()}`,
    nop_id: `${payload.nop_id}-${randomSuffix().toUpperCase()}`,
  };
  const { data: retry, error: retryError } = await supabase.from("social_profiles").insert(fallback).select("*").single();
  if (retryError) {
    throw retryError;
  }
  return retry as Profile;
};

export async function getProfileByWallet(wallet: string): Promise<Profile | null> {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }
  const normalized = sanitizeWallet(wallet);
  if (!normalized) return null;
  const { data, error } = await supabase
    .from("social_profiles")
    .select("*")
    .eq("wallet_address", normalized)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return (data as Profile) ?? null;
}

export async function getProfileById(id: string): Promise<Profile | null> {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }
  if (!id) return null;
  const { data, error } = await supabase.from("social_profiles").select("*").eq("id", id).maybeSingle();
  if (error) {
    throw error;
  }
  return (data as Profile) ?? null;
}

export async function getOrCreateCurrentProfile(): Promise<Profile> {
  const wallet = resolveWalletOrThrow();
  const existing = await getProfileByWallet(wallet);
  if (existing) {
    return existing;
  }
  return insertProfileRow(wallet);
}

export async function ensureProfileForWallet(wallet: string, overrides?: Partial<Profile>): Promise<Profile> {
  const normalized = sanitizeWallet(wallet);
  if (!normalized) {
    throw new Error("Wallet address is required");
  }
  const existing = await getProfileByWallet(normalized);
  if (existing) {
    return existing;
  }
  return insertProfileRow(normalized, overrides);
}

export async function updateProfile(input: {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  handle?: string;
}): Promise<Profile> {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }
  const profile = await getOrCreateCurrentProfile();
  const payload: Record<string, unknown> = {};
  if (typeof input.displayName === "string") payload.display_name = input.displayName.trim();
  if (typeof input.bio === "string") payload.bio = input.bio.trim();
  if (typeof input.avatarUrl === "string") payload.avatar_url = input.avatarUrl;
  if (typeof input.handle === "string" && input.handle.trim().length >= 3) {
    payload.handle = input.handle.trim().toLowerCase();
  }
  if (Object.keys(payload).length === 0) {
    return profile;
  }
  const { data, error } = await supabase
    .from("social_profiles")
    .update(payload)
    .eq("id", profile.id)
    .select("*")
    .single();
  if (error) {
    throw error;
  }
  return data as Profile;
}

export async function uploadAvatar(file: File): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }
  const wallet = resolveWalletOrThrow();
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${wallet}/${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });
  if (error) {
    throw error;
  }
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function listUserPosts(profileId: string, viewerWallet?: string): Promise<Post[]> {
  const profile = await getProfileById(profileId);
  const wallet = profile?.wallet_address;
  if (!wallet) {
    return [];
  }
  return fetchSocialFeed({ authorWallet: wallet, viewerWallet, includeHidden: false });
}

export async function listUserLikes(profileId: string, viewerWallet?: string): Promise<Post[]> {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }
  const { data, error } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    throw error;
  }
  const postIds = [...new Set((data ?? []).map((row) => Number(row.post_id)).filter((id) => Number.isFinite(id)))];
  if (postIds.length === 0) {
    return [];
  }
  return fetchPostsByIds(postIds, viewerWallet);
}

export async function getProfileByHandle(handle: string): Promise<Profile | null> {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }
  const normalized = handle?.toLowerCase().trim();
  if (!normalized) return null;
  const { data, error } = await supabase
    .from("social_profiles")
    .select("*")
    .eq("handle", normalized)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return (data as Profile) ?? null;
}

export function isProfileBanned(profile?: Profile | null): boolean {
  return Boolean(profile?.is_banned);
}
