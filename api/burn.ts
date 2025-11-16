import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { BurnSeriesPoint, BurnStats } from "../src/types/admin.js";

type SupabaseRow = {
  id: number;
  total?: number | string;
  total_burned?: number | string;
  last24h?: number | string;
  last_24h?: number | string;
  series?: BurnSeriesPoint[] | string | null;
  series_data?: BurnSeriesPoint[] | string | null;
  history?: BurnSeriesPoint[] | string | null;
  updated_at?: string;
  updatedAt?: string;
};

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const FALLBACK_PATH = path.join(process.cwd(), "src", "config", "burn.json");

const withHeaders = (res: VercelResponse): VercelResponse => {
  Object.entries(HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  return res;
};

const respond = (
  res: VercelResponse,
  statusCode: number,
  payload: Record<string, unknown>,
) => {
  withHeaders(res).status(statusCode).json(payload);
};

const normalizeSeries = (series: unknown): BurnSeriesPoint[] | undefined => {
  if (typeof series === "string") {
    try {
      const parsed = JSON.parse(series);
      if (Array.isArray(parsed)) {
        return normalizeSeries(parsed);
      }
    } catch (error) {
      console.warn("Failed to parse burn series JSON", error);
      return undefined;
    }
  }

  if (!Array.isArray(series)) {
    return undefined;
  }

  const normalized = series
    .map((point) => ({
      t: Number((point as BurnSeriesPoint).t),
      v: Number((point as BurnSeriesPoint).v),
    }))
    .filter(
      (point) =>
        Number.isFinite(point.t) &&
        Number.isFinite(point.v) &&
        point.t > 0 &&
        point.v >= 0,
    )
    .sort((a, b) => a.t - b.t);

  return normalized.length > 0 ? normalized : undefined;
};

const normalizeBurnStats = (input: Partial<BurnStats>): BurnStats | null => {
  if (typeof input.total !== "number" && typeof input.total !== "string") {
    return null;
  }

  const total = Number(input.total);
  const last24h = Number(
    typeof input.last24h === "number" || typeof input.last24h === "string"
      ? input.last24h
      : 0,
  );

  if (!Number.isFinite(total)) {
    return null;
  }

  const safeLast24h = Number.isFinite(last24h) ? last24h : 0;

  const updatedAt =
    typeof input.updatedAt === "string" ? input.updatedAt : undefined;

  return {
    total,
    last24h: safeLast24h,
    series: normalizeSeries(input.series),
    updatedAt: updatedAt ?? new Date().toISOString(),
  };
};

const fetchSupabaseBurnStats = async (): Promise<BurnStats | null> => {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }

  try {
    const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await client
      .from("burn_stats")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

   const row = data as SupabaseRow;

// total her zaman number olsun
const total: number =
  typeof row.total === "string"
    ? Number(row.total)
    : typeof row.total_burned === "string"
    ? Number(row.total_burned)
    : (row.total ?? row.total_burned ?? 0);

// last24h her zaman number olsun
const last24h: number =
  typeof row.last24h === "string"
    ? Number(row.last24h)
    : typeof row.last_24h === "string"
    ? Number(row.last_24h)
    : (row.last24h ?? row.last_24h ?? 0);

// series her zaman BurnSeriesPoint[] olsun
let rawSeries = row.series ?? row.series_data ?? row.history;

const series: BurnSeriesPoint[] =
  typeof rawSeries === "string"
    ? (JSON.parse(rawSeries) as BurnSeriesPoint[])
    : rawSeries ?? [];

const updatedAt = row.updated_at ?? row.updatedAt;

return normalizeBurnStats({
  total,
  last24h,
  series,
  updatedAt,
});

  } catch (error) {
    console.warn("Supabase burn stats request failed", error);
    return null;
  }
};

const readFallbackBurnStats = async (): Promise<BurnStats | null> => {
  try {
    const raw = await fs.readFile(FALLBACK_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<BurnStats>;
    return normalizeBurnStats(parsed);
  } catch (error) {
    console.warn("Failed to read burn fallback file", error);
    return null;
  }
};

const emptyStats = (): BurnStats => ({
  total: 0,
  last24h: 0,
  series: undefined,
  updatedAt: new Date().toISOString(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    withHeaders(res).status(204).end();
    return;
  }

  if (req.method !== "GET") {
    respond(res, 405, { error: "method_not_allowed" });
    return;
  }

  const supabaseData = await fetchSupabaseBurnStats();
  if (supabaseData) {
    respond(res, 200, { data: supabaseData });
    return;
  }

  const fallbackData = await readFallbackBurnStats();
  if (fallbackData) {
    respond(res, 200, { data: fallbackData });
    return;
  }

  respond(res, 200, { data: emptyStats() });
}
