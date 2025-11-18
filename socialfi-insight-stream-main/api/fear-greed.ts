import type { VercelRequest, VercelResponse } from "@vercel/node";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const API_ENDPOINT = "https://api.alternative.me/fng/";
const CACHE_TTL_MS = 15 * 60 * 1000;

type FearGreedRow = {
  value?: string;
  value_classification?: string;
  timestamp?: string;
};

type FearGreedPayload = {
  data?: FearGreedRow[];
  metadata?: { error?: string | null };
};

type FearGreedItem = {
  value: number;
  classification: string;
  change24h: number;
  timestamp: number;
  isoTime: string;
  source: string;
};

type CacheRecord = {
  item: FearGreedItem;
  expiresAt: number;
};

let cache: CacheRecord | null = null;

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

const normalizeRows = (rows: FearGreedRow[] | undefined): FearGreedItem => {
  const [latest, previous] = rows ?? [];
  if (!latest) {
    throw new Error("fear_greed_empty");
  }

  const latestValue = Number(latest.value ?? 0);
  const previousValue = Number(previous?.value ?? latest.value ?? 0);
  const delta = latestValue - previousValue;
  const timestampSeconds = Number(latest.timestamp ?? 0);
  const sanitizedValue = Number.isFinite(latestValue)
    ? Math.round(latestValue)
    : 0;
  const sanitizedChange = Number.isFinite(delta) ? Number(delta.toFixed(2)) : 0;
  const sanitizedTimestamp = Number.isFinite(timestampSeconds)
    ? timestampSeconds
    : Math.floor(Date.now() / 1000);

  return {
    value: Math.min(100, Math.max(0, sanitizedValue)),
    classification: latest.value_classification ?? "Unknown",
    change24h: sanitizedChange,
    timestamp: sanitizedTimestamp,
    isoTime: new Date(sanitizedTimestamp * 1000).toISOString(),
    source: "alternative.me",
  };
};

const fetchFearGreed = async (): Promise<FearGreedItem> => {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.item;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const url = new URL(API_ENDPOINT);
    url.searchParams.set("limit", "2");

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "nop-market-scanner/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`fear_greed_${response.status}`);
    }

    const payload = (await response.json()) as FearGreedPayload;
    if (payload.metadata?.error) {
      throw new Error(`fear_greed_${payload.metadata.error}`);
    }

    const item = normalizeRows(payload.data);
    cache = {
      item,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    return item;
  } finally {
    clearTimeout(timeout);
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    withHeaders(res).status(204).end();
    return;
  }

  if (req.method !== "GET") {
    respond(res, 405, { item: null, error: "method_not_allowed" });
    return;
  }

  try {
    const item = await fetchFearGreed();
    respond(res, 200, { item });
  } catch (error) {
    console.error("[api/fear-greed] failed", error);
    respond(res, 502, { item: null, error: "fear_greed_unavailable" });
  }
}
