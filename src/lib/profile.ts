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

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`);
  }

  // Validate file size (max 2MB)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    throw new Error(`File size too large. Maximum size is 2MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  const wallet = resolveWalletOrThrow();
  
  // Sanitize file extension
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const sanitizedExtension = ["jpg", "jpeg", "png", "webp", "gif"].includes(extension) ? extension : "jpg";
  
  // Create unique path with wallet address and timestamp
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(-6);
  const path = `${wallet}/${timestamp}-${randomSuffix}.${sanitizedExtension}`;

  try {
    // Check if bucket exists by trying to list it
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error("[uploadAvatar] Failed to list buckets:", listError);
      throw new Error("Storage service unavailable. Please contact support.");
    }

    const bucketExists = buckets?.some((b) => b.name === AVATAR_BUCKET);
    if (!bucketExists) {
      throw new Error(
        `Storage bucket '${AVATAR_BUCKET}' does not exist. Please create it in Supabase Dashboard → Storage → Buckets and mark it as public.`
      );
    }

    // Upload file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || `image/${sanitizedExtension}`,
      });

    if (uploadError) {
      console.error("[uploadAvatar] Upload error:", uploadError);
      
      // Provide more specific error messages
      if (uploadError.message.includes("new row violates row-level security")) {
        throw new Error("Storage bucket RLS policy error. Please check Supabase storage policies.");
      } else if (uploadError.message.includes("The resource already exists")) {
        // Try with a different path
        const retryPath = `${wallet}/${timestamp}-${Math.random().toString(36).slice(-6)}.${sanitizedExtension}`;
        const { data: retryData, error: retryError } = await supabase.storage
          .from(AVATAR_BUCKET)
          .upload(retryPath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || `image/${sanitizedExtension}`,
          });
        
        if (retryError) {
          throw new Error(`Upload failed: ${retryError.message}`);
        }
        
        const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(retryPath);
        return urlData.publicUrl;
      } else {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(uploadData.path);
    if (!urlData?.publicUrl) {
      throw new Error("Failed to get public URL for uploaded avatar");
    }

    return urlData.publicUrl;
  } catch (error) {
    // Re-throw with better error message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred during avatar upload");
  }
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
