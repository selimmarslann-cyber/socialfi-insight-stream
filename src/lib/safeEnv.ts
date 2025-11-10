export function readEnv() {
  const g: any =
    (typeof process !== 'undefined' ? ((process as any).env as Record<string, string | undefined>) : {}) || {}
  const vite: any =
    (typeof import.meta !== 'undefined' && (import.meta as any)?.env ? (import.meta as any).env : {}) || {}
  const url = g.NEXT_PUBLIC_SUPABASE_URL || vite.VITE_SUPABASE_URL
  const anon = g.NEXT_PUBLIC_SUPABASE_ANON_KEY || vite.VITE_SUPABASE_ANON_KEY
  return { url, anon }
}

export function isSupabaseConfigured() {
  const { url, anon } = readEnv()
  return Boolean(url && anon)
}
