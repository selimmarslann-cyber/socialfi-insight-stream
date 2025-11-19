type EnvRecord = Record<string, string | undefined>;

const importMetaEnv: EnvRecord =
  typeof import.meta !== "undefined" && (import.meta as { env?: EnvRecord }).env
    ? ((import.meta as { env?: EnvRecord }).env as EnvRecord)
    : {};

const nodeEnv: EnvRecord =
  typeof process !== "undefined" && typeof process.env === "object"
    ? (process.env as EnvRecord)
    : {};

const readMetaValue = (key: string, fallback = ""): string => {
  const value = importMetaEnv?.[key] ?? nodeEnv?.[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
};

const runtimeMode = readMetaValue("MODE", "production");
const isDevelopment = runtimeMode !== "production";

const SUPABASE_PUBLIC_URL_KEY = "VITE_SUPABASE_URL";
const SUPABASE_PUBLIC_ANON_KEY = "VITE_SUPABASE_ANON_KEY";

export const PUBLIC_ENV = {
  supabaseUrl: readMetaValue(SUPABASE_PUBLIC_URL_KEY),
  supabaseAnonKey: readMetaValue(SUPABASE_PUBLIC_ANON_KEY),
  apiBase: readMetaValue("VITE_API_BASE", "/api"),
  adminToken: readMetaValue("VITE_ADMIN_TOKEN"),
};

export const PROTOCOL_ENV = {
  nopTokenAddress: readMetaValue("VITE_NOP_TOKEN_ADDRESS"),
  l2RpcUrl: readMetaValue("VITE_L2_RPC_URL"),
  dexScreenerBase: readMetaValue(
    "VITE_DEXSCREENER_API_BASE",
    "https://api.dexscreener.com/latest/dex",
  ),
};

export const SUPABASE_REQUIRED_VARS = [
  SUPABASE_PUBLIC_URL_KEY,
  SUPABASE_PUBLIC_ANON_KEY,
] as const;

export const supabaseAdminHint = `Supabase yapılandırması eksik. Yönetici: ${SUPABASE_REQUIRED_VARS.join(
  " ve ",
)} değerlerini .env dosyanıza ekleyin.`;

export const isSupabaseConfigured = (): boolean =>
  Boolean(PUBLIC_ENV.supabaseUrl && PUBLIC_ENV.supabaseAnonKey);

const emitDevWarnings = (): void => {
  if (!isDevelopment) {
    return;
  }

  const missing: string[] = [];
  if (!PUBLIC_ENV.supabaseUrl) {
    missing.push(SUPABASE_PUBLIC_URL_KEY);
  }
  if (!PUBLIC_ENV.supabaseAnonKey) {
    missing.push(SUPABASE_PUBLIC_ANON_KEY);
  }

  if (missing.length > 0 && typeof console !== "undefined") {
    console.warn(
      `[env] Missing required environment variables: ${missing.join(
        ", ",
      )}. UI will show setup warnings until they are provided.`,
    );
  }
};

emitDevWarnings();
