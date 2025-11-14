/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_SUPABASE_URL?: string
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
  readonly NEXT_PUBLIC_NEWS_RSS?: string
  readonly NEXT_PUBLIC_NEWS_API_URL?: string
  readonly NEXT_PUBLIC_API_BASE_URL?: string
  readonly NEXT_PUBLIC_ENABLE_CLOUD_SCORES?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_NEWS_RSS?: string
  readonly VITE_NEWS_API_URL?: string
  readonly VITE_API_BASE?: string
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
