import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export async function uploadPostImage(file: File, userId: string) {
  if (!supabase) {
    throw new Error('Supabase client is not configured');
  }

  const path = `${userId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from('posts')
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from('posts').getPublicUrl(path);
  return data.publicUrl;
}
