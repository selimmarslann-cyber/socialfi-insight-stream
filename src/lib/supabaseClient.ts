import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (typeof window !== "undefined" && import.meta.env.DEV) {
  const runtimeProcessEnv =
    typeof process !== "undefined" && process?.env ? process.env : undefined;

  // eslint-disable-next-line no-console
  console.log(
    "SUPABASE_URL",
    runtimeProcessEnv?.NEXT_PUBLIC_SUPABASE_URL ??
      runtimeProcessEnv?.VITE_SUPABASE_URL ??
      import.meta.env?.VITE_SUPABASE_URL,
  );
}

if (!supabaseUrl || !supabaseAnonKey) {
  const warn = () => {
    // eslint-disable-next-line no-console
    console.warn(
      "Supabase client disabled: define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable realtime features.",
    );
  };

  if (typeof window !== "undefined") {
    warn();
  } else {
    warn();
  }
}

let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    throw new Error(
      "Supabase environment variables are missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  return supabaseClient;
};
