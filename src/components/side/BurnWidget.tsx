import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
} from 'react';
import { Link } from 'react-router-dom';
import { Flame, Wrench, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { BurnSeriesPoint, BurnStats } from '@/types/admin';
import {
  SIDE_CARD_CLASS,
  SIDE_CARD_TITLE_CLASS,
  SIDE_SKELETON_CLASS,
  SIDE_CARD_STYLE,
} from '@/components/side/common';
import { cn } from '@/lib/utils';

type LoadState = 'idle' | 'loading' | 'success' | 'error';

const RETRY_DELAYS = [500, 1000, 2000];
const BURN_ENDPOINT = '/api/burn';

const SPARKLINE_WIDTH = 160;
const SPARKLINE_HEIGHT = 48;
const SPARKLINE_PADDING = 6;

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const fetchBurnStats = async (): Promise<BurnStats> => {
  const response = await fetch(BURN_ENDPOINT, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`burn_fetch_failed_${response.status}`);
  }

  const payload = await response.json();
  if (payload?.data) {
    return payload.data as BurnStats;
  }

  return payload as BurnStats;
};

interface SparklineShape {
  linePath: string;
  areaPath: string;
  last: { x: number; y: number };
}

const buildSparkline = (series?: BurnSeriesPoint[]): SparklineShape | null => {
  if (!series || series.length < 2) {
    return null;
  }

  const sorted = [...series]
    .filter(
      (point) =>
        Number.isFinite(point.t) && Number.isFinite(point.v) && point.v >= 0,
    )
    .sort((a, b) => a.t - b.t);

  if (sorted.length < 2) {
    return null;
  }

  const values = sorted.map((point) => point.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const effectiveHeight = SPARKLINE_HEIGHT - SPARKLINE_PADDING * 2;
  const stepX = SPARKLINE_WIDTH / (sorted.length - 1);

  const coordinates = sorted.map((point, index) => {
    const x = index * stepX;
    const normalized = (point.v - min) / range;
    const y =
      SPARKLINE_HEIGHT -
      SPARKLINE_PADDING -
      normalized * effectiveHeight;
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
  });

  const lineCommands = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
    .join(' ');

  const areaPath = `${lineCommands} L${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT} L0 ${SPARKLINE_HEIGHT} Z`;

  return {
    linePath: lineCommands,
    areaPath,
    last: coordinates[coordinates.length - 1],
  };
};

const Sparkline = ({ series }: { series?: BurnSeriesPoint[] }) => {
  const shape = useMemo(() => buildSparkline(series), [series]);
  const id = useId();
  const areaId = `${id}-burn-area`;
  const lineId = `${id}-burn-line`;

  if (!shape) {
    return (
      <div className="h-16 w-full rounded-lg border border-dashed border-slate-200 bg-slate-50" />
    );
  }

  return (
    <svg
      viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
      role="img"
      aria-label="Token burn trend"
      className="h-16 w-full"
    >
      <defs>
        <linearGradient id={areaId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id={lineId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      <path d={shape.areaPath} fill={`url(#${areaId})`} opacity={0.6} />
      <path
        d={shape.linePath}
        fill="none"
        stroke={`url(#${lineId})`}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={shape.last.x}
        cy={shape.last.y}
        r={3}
        fill="#312e81"
        stroke="#ffffff"
        strokeWidth={1.5}
      />
    </svg>
  );
};

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

export const BurnWidget = () => {
  const [status, setStatus] = useState<LoadState>('idle');
  const [stats, setStats] = useState<BurnStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dataRef = useRef<BurnStats | null>(null);

  const loadStats = useCallback(async () => {
    const hasExistingData = Boolean(dataRef.current);
    setStatus(hasExistingData ? 'success' : 'loading');
    setIsRefreshing(hasExistingData);

    let attempt = 0;
    const maxAttempts = RETRY_DELAYS.length + 1;

    while (attempt < maxAttempts) {
      try {
        const data = await fetchBurnStats();
        dataRef.current = data;
        setStats(data);
        setStatus('success');
        setIsRefreshing(false);
        return;
      } catch (error) {
        attempt += 1;
        if (attempt >= maxAttempts) {
          setStatus('error');
          setIsRefreshing(false);
          return;
        }
        await wait(RETRY_DELAYS[attempt - 1]);
      }
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    dataRef.current = stats;
  }, [stats]);

  const handleRetry = useCallback(() => {
    void loadStats();
  }, [loadStats]);

  const formattedTotal = useMemo(() => {
    if (!stats) return '0';
    return numberFormatter.format(stats.total);
  }, [stats]);

  const formattedLast24h = useMemo(() => {
    if (!stats) return '0';
    const value = stats.last24h;
    const sign = value >= 0 ? '+' : '';
    return `${sign}${numberFormatter.format(value)}`;
  }, [stats]);

  const relativeUpdated = useMemo(() => {
    if (!stats?.updatedAt) {
      return null;
    }
    const date = new Date(stats.updatedAt);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return formatDistanceToNow(date, { addSuffix: true });
  }, [stats]);

  return (
    <section className={SIDE_CARD_CLASS} style={SIDE_CARD_STYLE}>
      <header className="flex items-start justify-between">
        <div>
          <h3 className={SIDE_CARD_TITLE_CLASS}>
            <Flame className="h-4 w-4 text-indigo-500" />
            Token Burn
          </h3>
          {relativeUpdated && (
            <p className="mt-1 text-xs text-slate-400">Updated {relativeUpdated}</p>
          )}
        </div>
        <Link
          to="/settings"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600"
          aria-label="Manage burn stats"
        >
          <Wrench className="h-4 w-4" />
        </Link>
      </header>

      <div className="mt-4 space-y-4">
        {status === 'loading' && !stats && (
          <div className="space-y-4">
            <div>
              <div className={cn(SIDE_SKELETON_CLASS, 'w-24')} />
              <div className={cn(SIDE_SKELETON_CLASS, 'mt-3 h-8 w-40')} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className={cn(SIDE_SKELETON_CLASS, 'w-24')} />
              <div className="h-16 flex-1 rounded-lg border border-dashed border-slate-200 bg-slate-50" />
            </div>
          </div>
        )}

        {status === 'error' && !stats && (
          <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4 text-sm text-slate-600">
            <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-rose-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-600">
              Data paused
            </div>
            <p>We could not reach the burn telemetry service.</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-3 inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}

        {stats && (
          <>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Burned
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-800">
                {formattedTotal}
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-indigo-500">
                  Last 24h
                </p>
                <p className="mt-1 text-lg font-semibold text-indigo-700">
                  {formattedLast24h}
                </p>
              </div>
              <div className="sm:min-w-[160px]">
                <Sparkline series={stats.series} />
              </div>
            </div>

            {stats.series && stats.series.length > 1 && (
              <p className="text-xs text-slate-500">
                Peak hourly burn{' '}
                <span className="font-semibold text-slate-700">
                  {numberFormatter.format(
                    Math.max(...stats.series.map((point) => point.v)),
                  )}
                </span>
              </p>
            )}
          </>
        )}

        {status === 'error' && stats && (
          <div className="flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2 text-xs text-rose-600">
            <span className="font-medium">Live updates delayed.</span>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        )}

        {isRefreshing && (
          <p className="text-xs text-slate-400">Refreshing burn analytics…</p>
        )}
      </div>
    </section>
  );
};
