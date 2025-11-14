type EnvBag = Record<string, string | undefined>

const globalEnv: EnvBag =
  (typeof process !== 'undefined' && process?.env ? (process.env as EnvBag) : {}) || {}

const metaEnv: EnvBag = (() => {
  try {
    return (typeof import.meta !== 'undefined' && (import.meta as any)?.env
      ? ((import.meta as any).env as EnvBag)
      : {}) as EnvBag
  } catch {
    return {}
  }
})()

const ENV_SOURCES: EnvBag[] = [metaEnv, globalEnv]

const readValue = (...keys: string[]) => {
  for (const key of keys) {
    for (const source of ENV_SOURCES) {
      const value = source?.[key]
      if (typeof value === 'string' && value.length > 0) {
        return value
      }
    }
  }
  return undefined
}

export function readSupabaseEnv() {
  const url = readValue('NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL', 'SUPABASE_URL')
  const anon = readValue('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY')
  return { url, anon }
}

export function readEnv() {
  return readSupabaseEnv()
}

export function readApiBaseUrl() {
  return readValue('NEXT_PUBLIC_API_BASE_URL', 'VITE_API_BASE_URL', 'VITE_API_BASE')
}

export function readNewsConfig() {
  return {
    rssList: readValue('NEXT_PUBLIC_NEWS_RSS', 'VITE_NEWS_RSS'),
    apiUrl: readValue('NEXT_PUBLIC_NEWS_API_URL', 'VITE_NEWS_API_URL'),
    apiKey: readValue('NEWS_API_KEY', 'CRYPTOPANIC_API_KEY', 'VITE_CRYPTOPANIC_KEY'),
  }
}

export function isSupabaseConfigured() {
  const { url, anon } = readSupabaseEnv()
  return Boolean(url && anon)
}
