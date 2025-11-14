import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { BurnStats, BurnSeriesPoint } from '../types/admin';

interface NetlifyEvent {
  httpMethod: string;
}

interface NetlifyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

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
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const FALLBACK_PATH = path.join(process.cwd(), 'src', 'config', 'burn.json');

const normalizeSeries = (series: unknown): BurnSeriesPoint[] | undefined => {
  if (typeof series === 'string') {
    try {
      const parsed = JSON.parse(series);
      if (Array.isArray(parsed)) {
        return normalizeSeries(parsed);
      }
    } catch (error) {
      console.warn('Failed to parse burn series JSON', error);
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
  if (typeof input.total !== 'number' && typeof input.total !== 'string') {
    return null;
  }

  const total = Number(input.total);
  const last24h = Number(
    typeof input.last24h === 'number' || typeof input.last24h === 'string'
      ? input.last24h
      : 0,
  );

  if (!Number.isFinite(total)) {
    return null;
  }

  const safeLast24h = Number.isFinite(last24h) ? last24h : 0;

  const updatedAt =
    typeof input.updatedAt === 'string' ? input.updatedAt : undefined;

  return {
    total,
    last24h: safeLast24h,
    series: normalizeSeries(input.series),
    updatedAt: updatedAt ?? new Date().toISOString(),
  };
};

const readServerEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return undefined;
};

const fetchSupabaseBurnStats = async (): Promise<BurnStats | null> => {
  const SUPABASE_URL =
    readServerEnv('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL') ?? '';
  const SERVICE_ROLE_KEY = readServerEnv(
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_KEY',
    'SERVICE_ROLE_KEY',
  );
  const PUBLIC_ANON_KEY = readServerEnv(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_ANON_KEY',
  );
  const SUPABASE_KEY = SERVICE_ROLE_KEY ?? PUBLIC_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn(
      '[burn-api] Supabase env eksik. SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY değerlerini ekleyin.',
    );
    return null;
  }
  if (!SERVICE_ROLE_KEY) {
    console.warn(
      '[burn-api] Service role anahtarı bulunamadı. Okuma yetkisi kısıtlı olabilir; SUPABASE_SERVICE_ROLE_KEY ekleyin.',
    );
  }

  try {
    const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await client
      .from<SupabaseRow>('burn_stats')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return normalizeBurnStats({
      total: data.total ?? data.total_burned,
      last24h: data.last24h ?? data.last_24h,
      series: data.series ?? data.series_data ?? data.history,
      updatedAt: data.updated_at ?? data.updatedAt,
    });
  } catch (error) {
    console.warn('Supabase burn stats request failed', error);
    return null;
  }
};

const readFallbackBurnStats = async (): Promise<BurnStats | null> => {
  try {
    const raw = await fs.readFile(FALLBACK_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<BurnStats>;
    return normalizeBurnStats(parsed);
  } catch (error) {
    console.warn('Failed to read burn fallback file', error);
    return null;
  }
};

const buildResponse = (data: BurnStats): NetlifyResponse => ({
  statusCode: 200,
  headers: HEADERS,
  body: JSON.stringify({ data }),
});

const emptyResponse = (): NetlifyResponse =>
  buildResponse({
    total: 0,
    last24h: 0,
    series: undefined,
    updatedAt: new Date().toISOString(),
  });

export const handler = async (
  event: NetlifyEvent,
): Promise<NetlifyResponse> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const supabaseData = await fetchSupabaseBurnStats();
  if (supabaseData) {
    return buildResponse(supabaseData);
  }

  const fallbackData = await readFallbackBurnStats();
  if (fallbackData) {
    return buildResponse(fallbackData);
  }

  return emptyResponse();
};
