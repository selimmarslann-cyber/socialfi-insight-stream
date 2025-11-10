import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

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

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
