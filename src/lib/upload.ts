import { getSupabase, supabaseAdminHint } from "@/lib/supabaseClient";
import { isSupabaseConfigured } from "@/config/env";

export async function uploadPostImage(file: File, userId: string) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error(supabaseAdminHint);
  }

  const path = `${userId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from("posts")
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("posts").getPublicUrl(path);
  return data.publicUrl;
}

export { isSupabaseConfigured };
