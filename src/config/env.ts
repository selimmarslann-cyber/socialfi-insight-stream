type EnvRecord = Record<string, string | undefined>;

const processEnv: EnvRecord =
  typeof process !== "undefined" && process.env
    ? (process.env as EnvRecord)
    : {};

const importMetaEnv: EnvRecord =
  typeof import.meta !== "undefined" && (import.meta as { env?: EnvRecord }).env
    ? ((import.meta as { env?: EnvRecord }).env as EnvRecord)
    : {};

const readEnvValue = (...keys: string[]): string | undefined => {
  for (const key of keys) {
    const fromMeta = importMetaEnv?.[key];
    if (typeof fromMeta === "string" && fromMeta.length > 0) {
      return fromMeta;
    }
    const fromProcess = processEnv?.[key];
    if (typeof fromProcess === "string" && fromProcess.length > 0) {
      return fromProcess;
    }
  }
  return undefined;
};

const parseCsvList = (value?: string): string[] =>
  value
    ? value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];

const runtimeMode =
  importMetaEnv?.MODE ??
  processEnv?.NODE_ENV ??
  processEnv?.VITE_MODE ??
  "production";
const isDevelopment = runtimeMode !== "production";

const SUPABASE_PUBLIC_URL_KEY = "VITE_SUPABASE_URL";
const SUPABASE_PUBLIC_ANON_KEY = "VITE_SUPABASE_ANON_KEY";

export const PUBLIC_ENV = {
  supabaseUrl:
    readEnvValue(
      SUPABASE_PUBLIC_URL_KEY,
      "NEXT_PUBLIC_SUPABASE_URL",
      "REACT_APP_SUPABASE_URL",
    ) ?? "",
  supabaseAnonKey:
    readEnvValue(
      SUPABASE_PUBLIC_ANON_KEY,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "REACT_APP_SUPABASE_ANON_KEY",
    ) ?? "",
  newsRss: readEnvValue("VITE_NEWS_RSS", "NEXT_PUBLIC_NEWS_RSS") ?? "",
  apiBase: readEnvValue("VITE_API_BASE") ?? "/api",
  adminToken: readEnvValue("VITE_ADMIN_TOKEN") ?? "",
};

export const SERVER_ENV = {
  supabaseUrl:
    readEnvValue(
      "SUPABASE_URL",
      SUPABASE_PUBLIC_URL_KEY,
      "NEXT_PUBLIC_SUPABASE_URL",
      "REACT_APP_SUPABASE_URL",
    ) ?? "",
  supabaseServiceRoleKey:
    readEnvValue("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY") ?? "",
  adminToken: readEnvValue("ADMIN_TOKEN") ?? PUBLIC_ENV.adminToken,
  cryptopanicKey:
    readEnvValue("CRYPTOPANIC_API_KEY", "VITE_CRYPTOPANIC_KEY") ?? "",
};

export const SUPABASE_REQUIRED_VARS = [
  SUPABASE_PUBLIC_URL_KEY,
  SUPABASE_PUBLIC_ANON_KEY,
] as const;

export const NEWS_REQUIRED_VARS = ["VITE_NEWS_RSS"] as const;

export const supabaseAdminHint = `Supabase yapılandırması eksik. Yönetici: ${SUPABASE_REQUIRED_VARS.join(
  " ve ",
)} değerlerini .env dosyanıza ekleyin.`;

export const newsEnvHint =
  "AI News kartı için VITE_NEWS_RSS (CSV formatında RSS listesi) çevresel değişkenini tanımlayın.";

export const isSupabaseConfigured = (): boolean =>
  Boolean(PUBLIC_ENV.supabaseUrl && PUBLIC_ENV.supabaseAnonKey);

export const isNewsConfigured = (): boolean =>
  PUBLIC_ENV.newsRss.trim().length > 0;

export const PUBLIC_ENV_ARRAYS = {
  newsRssList: parseCsvList(PUBLIC_ENV.newsRss),
};

const emitDevWarnings = () => {
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
  if (!PUBLIC_ENV.newsRss) {
    missing.push(NEWS_REQUIRED_VARS[0]);
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
