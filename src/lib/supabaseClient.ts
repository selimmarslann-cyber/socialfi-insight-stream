import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  PUBLIC_ENV,
  isSupabaseConfigured,
  supabaseAdminHint,
} from "@/config/env";

let client: SupabaseClient<Database> | null = null;
let warned = false;

export function getSupabase(): SupabaseClient<Database> | null {
  if (client) return client;
  if (!isSupabaseConfigured()) {
    if (!warned && typeof console !== "undefined") {
      console.warn(`[supabase] ${supabaseAdminHint}`);
      warned = true;
    }
    return null;
  }
  client = createClient<Database>(
    PUBLIC_ENV.supabaseUrl,
    PUBLIC_ENV.supabaseAnonKey,
    {
      auth: { persistSession: true, autoRefreshToken: true },
    },
  );
  return client;
}

export const supabase = getSupabase();

export { isSupabaseConfigured, supabaseAdminHint } from "@/config/env";
