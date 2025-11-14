import { getSupabase, SUPABASE_ENV_WARNING } from '@/lib/supabaseClient'

export function canUploadViaSupabase() {
  return Boolean(getSupabase())
}

export async function uploadPostImage(file: File, userId: string) {
  const supabase = getSupabase()
  if (!supabase) {
    throw new Error(SUPABASE_ENV_WARNING)
  }

  const path = `${userId}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage
    .from('posts')
    .upload(path, file, { upsert: false, contentType: file.type })

  if (error) {
    throw error
  }

  const { data } = supabase.storage.from('posts').getPublicUrl(path)
  return data.publicUrl
}
