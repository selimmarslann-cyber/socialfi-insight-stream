import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PROTOCOL_ENV } from "../src/config/env.js";
import type { Database } from "../src/integrations/supabase/types.js";

type ReputationRow = Database["public"]["Tables"]["reputation_scores"]["Row"];
type PositionRow = Database["public"]["Tables"]["social_positions"]["Row"];
type NewsRow = Database["public"]["Tables"]["news_cache"]["Row"];

const jsonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
} as const;

const withHeaders = (res: VercelResponse): VercelResponse => {
  Object.entries(jsonHeaders).forEach(([key, value]) => res.setHeader(key, value));
  return res;
};

const respond = (res: VercelResponse, statusCode: number, payload: Record<string, unknown>) => {
  withHeaders(res).status(statusCode).json(payload);
};

const createSupabaseServerClient = (): SupabaseClient<Database> | null => {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !serviceKey) {
    return null;
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  });
};

const takeData = <T>(response: { data: T | null; error: unknown }): T | null => {
  if ("error" in response && response.error) {
    console.warn("[intelligence-feed] supabase query failed", response.error);
    return null;
  }
  return response.data;
};

const fetchDexScreener = async () => {
  const tokenAddress = process.env.NOP_TOKEN_ADDRESS ?? PROTOCOL_ENV.nopTokenAddress;
  if (!tokenAddress) {
    return null;
  }
  const base = PROTOCOL_ENV.dexScreenerBase || "https://api.dexscreener.com/latest/dex";
  const url = `${base}/tokens/${tokenAddress}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`dexscreener_${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("[intelligence-feed] DexScreener fetch failed", error);
    return null;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    withHeaders(res).status(204).end();
    return;
  }

  if (req.method !== "GET") {
    respond(res, 405, { error: "method_not_allowed" });
    return;
  }

  try {
    const supabase = createSupabaseServerClient();

    const topReputationPromise = supabase
      ? supabase
          .from("reputation_scores")
          .select("*")
          .order("realized_pnl_usd", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: null, error: "supabase_not_configured" });

    const recentPositionsPromise = supabase
      ? supabase
          .from("social_positions")
          .select("*")
          .order("opened_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: null, error: "supabase_not_configured" });

    const newsPromise = supabase
      ? supabase
          .from("news_cache")
          .select("*")
          .order("published_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: null, error: "supabase_not_configured" });

    const [topReputationResp, recentPositionsResp, newsResp, nopMarket] = await Promise.all([
      topReputationPromise,
      recentPositionsPromise,
      newsPromise,
      fetchDexScreener(),
    ]);

    const payload = {
      topReputation: (takeData<ReputationRow[]>(topReputationResp) ?? []).filter(Boolean),
      recentPositions: (takeData<PositionRow[]>(recentPositionsResp) ?? []).filter(Boolean),
      news: (takeData<NewsRow[]>(newsResp) ?? []).filter(Boolean),
      nopMarket,
    };

    respond(res, 200, payload);
  } catch (error) {
    console.error("[intelligence-feed] unexpected error", error);
    respond(res, 500, { error: "failed_to_load_intelligence_feed" });
  }
}
