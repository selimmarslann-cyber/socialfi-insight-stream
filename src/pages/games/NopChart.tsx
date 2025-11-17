import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { cn } from '../../lib/utils';

const COLS = 12;
const ROWS = 12;
const VIEWBOX_SIZE = 100;
const TICK_MS = 500; // 0.5s per tick
const TICKS_PER_CANDLE = 40; // 20s per candle
const MIN_FORWARD_COLS = 2;
const LOOKAHEAD_COLS = MIN_FORWARD_COLS + 1; // leave room for future predictions
const MAX_VISIBLE_CANDLES = 24;
const MIN_STAKE = 10;
const START_BALANCE = 1000;
const MAX_RECENT_RESULTS = 8;

type Candle = {
  index: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type BetStatus = 'active' | 'won' | 'lost';

type Bet = {
  id: string;
  boxX: number;
  boxY: number;
  stake: number;
  placedAt: number;
  multiplier: number;
  status: BetStatus;
  targetIndex: number;
  resolvedAt?: number;
  payout?: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

const rowIndexFromY = (y: number) => {
  const safe = clamp(y, 0, VIEWBOX_SIZE - Number.EPSILON);
  const rowHeight = VIEWBOX_SIZE / ROWS;
  const distanceFromBottom = VIEWBOX_SIZE - safe;
  const raw = Math.floor(distanceFromBottom / rowHeight);
  return Math.max(0, Math.min(ROWS - 1, raw));
};

const yFromPrice = (price: number) => clamp(VIEWBOX_SIZE - price, 0, VIEWBOX_SIZE);

const rowIndexFromPrice = (price: number) => rowIndexFromY(yFromPrice(price));

const rowPriceRange = (row: number) => {
  const slice = VIEWBOX_SIZE / ROWS;
  return {
    min: row * slice,
    max: (row + 1) * slice,
  };
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const getBaseMultiplier = (dVert: number) => {
  if (dVert === 0) return 1;
  if (dVert === 1) return 1.3;
  if (dVert === 2) return 1.7;
  if (dVert === 3) return 2.3;
  if (dVert === 4) return 3.2;
  return 4;
};

const getForwardBonus = (dHoriz: number) => {
  const extraSteps = Math.max(0, dHoriz - MIN_FORWARD_COLS);
  const raw = 1 + 0.03 * extraSteps;
  return Math.min(raw, 1.25);
};

const computeMultiplier = ({
  headRow,
  headColumn,
  boxX,
  boxY,
}: {
  headRow: number;
  headColumn: number;
  boxX: number;
  boxY: number;
}) => {
  const dVert = Math.abs(boxY - headRow);
  const base = getBaseMultiplier(dVert);
  const dHoriz = boxX - headColumn;
  const bonus = getForwardBonus(dHoriz);
  return Number((base * bonus).toFixed(2));
};

const formatDelta = (value: number) => {
  if (!Number.isFinite(value)) return '0.00%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const stepPrice = (prev: number) => {
  const r = Math.random();
  const delta = r < 0.15 ? randomBetween(-30, 30) : randomBetween(-8, 8);
  return clamp(prev + delta, 0, 100);
};

export default function NopChartGame() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentCandle, setCurrentCandle] = useState<Candle | null>(null);
  const tickRef = useRef(0);

  const [balance, setBalance] = useState(START_BALANCE);
  const [stake, setStake] = useState(MIN_STAKE);
  const [bets, setBets] = useState<Bet[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [seriesStartPrice, setSeriesStartPrice] = useState<number | null>(null);
  const [tenSecRefPrice, setTenSecRefPrice] = useState<number | null>(null);
  const [lastTenSecUpdatedAt, setLastTenSecUpdatedAt] = useState<number>(Date.now());

  const columnWidth = VIEWBOX_SIZE / COLS;
  const rowHeight = VIEWBOX_SIZE / ROWS;
  const headIndex = currentCandle?.index ?? candles[candles.length - 1]?.index ?? 0;
  const columnsBehindHead = Math.max(0, COLS - LOOKAHEAD_COLS - 1);
  const leftmostIndex = Math.max(0, headIndex - columnsBehindHead);
  const headColumn = Math.max(0, Math.min(headIndex - leftmostIndex, COLS - LOOKAHEAD_COLS - 1));
  const livePrice = currentCandle?.close ?? candles[candles.length - 1]?.close ?? seriesStartPrice ?? 50;
  const headRow = rowIndexFromPrice(livePrice);
  const safeColumnThreshold = Math.min(COLS, headColumn + MIN_FORWARD_COLS);

  const initializeSeries = useCallback(() => {
    const startPrice = randomBetween(20, 80);
    const first: Candle = {
      index: 0,
      open: startPrice,
      high: startPrice,
      low: startPrice,
      close: startPrice,
    };
    tickRef.current = 0;
    setCandles([]);
    setCurrentCandle(first);
    setSeriesStartPrice(startPrice);
    setTenSecRefPrice(startPrice);
    setLastTenSecUpdatedAt(Date.now());
  }, []);

  const closeCurrentCandle = useCallback(() => {
    setCurrentCandle((prev) => {
      if (!prev) return prev;
      setCandles((existing) => {
        const next = [...existing, prev];
        return next.length > MAX_VISIBLE_CANDLES ? next.slice(next.length - MAX_VISIBLE_CANDLES) : next;
      });
      const nextOpen = prev.close;
      return {
        index: prev.index + 1,
        open: nextOpen,
        high: nextOpen,
        low: nextOpen,
        close: nextOpen,
      };
    });
  }, []);

  useEffect(() => {
    initializeSeries();
  }, [initializeSeries]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCurrentCandle((prev) => {
        if (!prev) return prev;
        const nextClose = stepPrice(prev.close);
        return {
          ...prev,
          close: nextClose,
          high: Math.max(prev.high, nextClose),
          low: Math.min(prev.low, nextClose),
        };
      });
      tickRef.current += 1;
      if (tickRef.current >= TICKS_PER_CANDLE) {
        tickRef.current = 0;
        closeCurrentCandle();
      }
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [closeCurrentCandle]);

  useEffect(() => {
    const now = Date.now();
    if (now - lastTenSecUpdatedAt >= 10_000 && livePrice != null) {
      setTenSecRefPrice(livePrice);
      setLastTenSecUpdatedAt(now);
    }
  }, [lastTenSecUpdatedAt, livePrice]);

  const candleMap = useMemo(() => {
    const map = new Map<number, Candle>();
    candles.forEach((candle) => map.set(candle.index, candle));
    if (currentCandle) {
      map.set(currentCandle.index, currentCandle);
    }
    return map;
  }, [candles, currentCandle]);

  useEffect(() => {
    if (!candleMap.size) return;
    setBets((prev) => {
      if (!prev.length) return prev;
      let changed = false;
      let balanceDelta = 0;
      const now = Date.now();
      const next = prev.map((bet) => {
        if (bet.status !== 'active') return bet;
        if (bet.targetIndex < leftmostIndex) {
          changed = true;
          return { ...bet, status: 'lost', resolvedAt: now, payout: 0 };
        }
        const target = candleMap.get(bet.targetIndex);
        if (target) {
          const { min, max } = rowPriceRange(bet.boxY);
          const hit = target.high >= min && target.low <= max;
          if (hit) {
            const payout = Math.round(bet.stake * bet.multiplier);
            balanceDelta += payout;
            changed = true;
            return { ...bet, status: 'won', resolvedAt: now, payout };
          }
        }
        return bet;
      });
      if (balanceDelta > 0) {
        setBalance((prevBalance) => prevBalance + balanceDelta);
      }
      return changed ? next : prev;
    });
  }, [candleMap, leftmostIndex]);

  useEffect(() => {
    if (balance >= MIN_STAKE && stake > balance) {
      setStake(Math.max(MIN_STAKE, Math.floor(balance / 10) * 10) || MIN_STAKE);
    }
  }, [balance, stake]);

  const handleStakeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = Number(event.target.value);
    if (Number.isNaN(raw)) {
      setStake(MIN_STAKE);
      return;
    }
    const normalized = Math.max(MIN_STAKE, Math.round(raw / 10) * 10);
    setStake(Math.min(balance, normalized));
  };

  const adjustStake = (delta: number) => {
    setStake((prev) => {
      const next = Math.max(MIN_STAKE, prev + delta);
      return Math.min(balance, Math.round(next / 10) * 10);
    });
  };

  const handleBoxClick = useCallback(
    (boxX: number, boxY: number) => {
      if (!currentCandle) return;
      if (stake < MIN_STAKE) {
        setWarning('Minimum stake is 10 NOP.');
        return;
      }
      if (balance < stake) {
        setWarning('Not enough NOP balance for this stake.');
        return;
      }
      const targetIndex = leftmostIndex + boxX;
      if (targetIndex < currentCandle.index + MIN_FORWARD_COLS) {
        setWarning('Place predictions at least two columns ahead of the live candle.');
        return;
      }
      const multiplier = computeMultiplier({ headRow, headColumn, boxX, boxY });
      const newBet: Bet = {
        id: generateId(),
        boxX,
        boxY,
        stake,
        placedAt: Date.now(),
        multiplier,
        status: 'active',
        targetIndex,
      };
      setBalance((prev) => prev - stake);
      setBets((prev) => [newBet, ...prev]);
      setWarning(null);
    },
    [balance, currentCandle, headColumn, headRow, leftmostIndex, stake],
  );

  const gridRows = useMemo(() => Array.from({ length: ROWS }, (_, idx) => idx), []);
  const gridCols = useMemo(() => Array.from({ length: COLS }, (_, idx) => idx), []);

  const activeBets = useMemo(() => bets.filter((bet) => bet.status === 'active'), [bets]);

  const recentResults = useMemo(
    () =>
      [...bets]
        .filter((bet) => bet.status !== 'active')
        .sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0))
        .slice(0, MAX_RECENT_RESULTS),
    [bets],
  );

  const cellHighlights = useMemo(() => {
    const map = new Map<string, number>();
    activeBets.forEach((bet) => {
      const colInView = bet.targetIndex - leftmostIndex;
      if (colInView < 0 || colInView >= COLS) return;
      const key = `${colInView}-${bet.boxY}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [activeBets, leftmostIndex]);

  const visibleCandles = useMemo(() => {
    const closed = candles.filter((candle) => candle.index >= leftmostIndex && candle.index <= headIndex);
    closed.sort((a, b) => a.index - b.index);
    if (currentCandle && currentCandle.index >= leftmostIndex) {
      return [...closed, currentCandle];
    }
    return closed;
  }, [candles, currentCandle, headIndex, leftmostIndex]);

  const linePoints = useMemo(() => {
    if (!visibleCandles.length) return '';
    return visibleCandles
      .map((candle) => {
        const col = candle.index - leftmostIndex;
        if (col < 0 || col >= COLS) return null;
        const x = (col + 0.5) * columnWidth;
        const y = yFromPrice(candle.close);
        return `${x},${y}`;
      })
      .filter((point): point is string => Boolean(point))
      .join(' ');
  }, [columnWidth, leftmostIndex, visibleCandles]);

  const totalDeltaPct =
    seriesStartPrice != null && seriesStartPrice !== 0
      ? ((livePrice - seriesStartPrice) / seriesStartPrice) * 100
      : 0;

  const lastTenSecDeltaPct =
    tenSecRefPrice != null && tenSecRefPrice !== 0 ? ((livePrice - tenSecRefPrice) / tenSecRefPrice) * 100 : 0;

  const canPlace = Boolean(currentCandle) && balance >= stake && stake >= MIN_STAKE;

  const candlesToRender = visibleCandles;

  const headCx = (headColumn + 0.5) * columnWidth;
  const headCy = yFromPrice(livePrice);

  const colsAhead = Math.max(0, COLS - safeColumnThreshold);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F5F8FF]">
      <div className="max-w-6xl mx-auto w-full py-6 px-4 lg:px-0 flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500">NOP Intelligence Layer</div>
            <div className="text-2xl font-semibold text-slate-900">NopChart — Live Time Game</div>
            <div className="text-[12px] text-slate-500">
              Predict the path of the next candles. Hit the box, win NOP. Miss, you burn it.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-600 shadow-sm">
              Balance <span className="text-slate-900">{balance.toLocaleString()} NOP</span>
            </div>
            <div className="rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm">
              Stake {stake} NOP
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)] gap-4">
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Live chart</div>
                  <div className="text-[11px] text-slate-400">Candles close every 20s · scrolling view</div>
                </div>
                <div className="text-[11px] text-slate-500">0.5s ticks · {COLS} cols</div>
              </div>
              <div className="relative">
                <svg className="w-full h-[65vh] max-h-[520px]" viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}>
                  <defs>
                    <linearGradient id="nopChartWick" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <linearGradient id="nopChartGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.35" />
                    </linearGradient>
                  </defs>
                  <rect x={0} y={0} width={VIEWBOX_SIZE} height={VIEWBOX_SIZE} rx={16} className="fill-white" />
                  <rect
                    x={0}
                    y={0}
                    width={Math.min(safeColumnThreshold, COLS) * columnWidth}
                    height={VIEWBOX_SIZE}
                    className="fill-slate-900/5"
                    opacity={0.35}
                    pointerEvents="none"
                  />
                  <g>
                    {gridCols.map((col) =>
                      gridRows.map((row) => {
                        const key = `${col}-${row}`;
                        const x = col * columnWidth;
                        const y = VIEWBOX_SIZE - (row + 1) * rowHeight;
                        const isAhead = leftmostIndex + col >= headIndex + MIN_FORWARD_COLS;
                        const isActive = cellHighlights.has(key);
                        return (
                          <rect
                            key={key}
                            x={x + 0.2}
                            y={y + 0.2}
                            width={columnWidth - 0.4}
                            height={rowHeight - 0.4}
                            rx={1.2}
                            className={cn(
                              'stroke-slate-200/40 fill-slate-900/2 transition-colors duration-150',
                              isActive && 'fill-indigo-100/60 stroke-indigo-400/70',
                              canPlace && isAhead && 'cursor-pointer hover:fill-cyan-200/30',
                              (!canPlace || !isAhead) && 'cursor-not-allowed opacity-60',
                            )}
                            strokeWidth={0.4}
                            onClick={() => (canPlace && isAhead ? handleBoxClick(col, row) : undefined)}
                          />
                        );
                      }),
                    )}
                  </g>
                  {linePoints && (
                    <polyline
                      points={linePoints}
                      fill="none"
                      stroke="url(#nopChartGlow)"
                      strokeWidth={0.45}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {candlesToRender.map((candle) => {
                    const col = candle.index - leftmostIndex;
                    if (col < 0 || col >= COLS - LOOKAHEAD_COLS) return null;
                    const cx = (col + 0.5) * columnWidth;
                    const wickTop = yFromPrice(candle.high);
                    const wickBottom = yFromPrice(candle.low);
                    const openY = yFromPrice(candle.open);
                    const closeY = yFromPrice(candle.close);
                    const bodyTop = Math.min(openY, closeY);
                    const bodyHeight = Math.max(2, Math.abs(openY - closeY));
                    const isUp = candle.close >= candle.open;
                    return (
                      <g key={candle.index}>
                        <line
                          x1={cx}
                          x2={cx}
                          y1={wickTop}
                          y2={wickBottom}
                          stroke="url(#nopChartWick)"
                          strokeWidth={0.4}
                          strokeLinecap="round"
                        />
                        <rect
                          x={cx - columnWidth * 0.25}
                          width={columnWidth * 0.5}
                          y={bodyTop}
                          height={bodyHeight}
                          className={cn('stroke-none', isUp ? 'fill-emerald-400/80' : 'fill-rose-400/80')}
                          rx={0.6}
                        />
                      </g>
                    );
                  })}
                  {currentCandle && (
                    <circle cx={headCx} cy={headCy} r={1.2} className="fill-cyan-400 stroke-white" strokeWidth={0.4} />
                  )}
                </svg>
                <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-600 shadow">
                  Safe zone: place bets ≥ {MIN_FORWARD_COLS} cols ahead of live price
                </div>
                <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-600 shadow">
                  {colsAhead} cols open for predictions
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Stake control</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {stake.toLocaleString()} <span className="text-xs text-slate-500">NOP per prediction</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
                    onClick={() => adjustStake(-10)}
                  >
                    -10
                  </button>
                  <input
                    type="number"
                    min={MIN_STAKE}
                    step={10}
                    value={stake}
                    onChange={handleStakeChange}
                    className="h-11 w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 text-right text-sm font-semibold text-slate-800 shadow-inner focus:border-indigo-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
                    onClick={() => adjustStake(10)}
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100"
                    onClick={() => adjustStake(50)}
                  >
                    +50
                  </button>
                </div>
              </div>
              {warning && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-600">{warning}</div>
              )}
              <p className="text-sm text-slate-500">
                Place predictions ahead of the live candle. If the wick or body enters your box you are paid instantly based on distance.
                Once the column scrolls past the window, that stake burns.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Live Δ%</div>
                <div className="text-[11px] text-slate-500">Rolling candle flow</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <span className="text-[11px] text-slate-500">From start</span>
                  <div
                    className={cn(
                      'text-lg font-semibold',
                      totalDeltaPct > 0 && 'text-emerald-500',
                      totalDeltaPct < 0 && 'text-rose-500',
                      totalDeltaPct === 0 && 'text-slate-500',
                    )}
                  >
                    {formatDelta(totalDeltaPct)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <span className="text-[11px] text-slate-500">Last ~10s</span>
                  <div
                    className={cn(
                      'text-lg font-semibold',
                      lastTenSecDeltaPct > 0 && 'text-emerald-500',
                      lastTenSecDeltaPct < 0 && 'text-rose-500',
                      lastTenSecDeltaPct === 0 && 'text-slate-500',
                    )}
                  >
                    {formatDelta(lastTenSecDeltaPct)}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">
                Distance to the wick is the main risk. Forward columns add up to +25% bonus multiplier.
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Active bets</div>
                <span className="text-[11px] text-slate-500">{activeBets.length} live</span>
              </div>
              {activeBets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                  No live predictions. Tap a grid box ahead of the candle to queue one.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeBets.slice(0, 6).map((bet) => {
                    const ahead = bet.targetIndex - headIndex;
                    return (
                      <div key={bet.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 px-3 py-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">
                            C{bet.boxX + 1} · R{bet.boxY + 1}
                          </span>
                          <span className="text-[11px] text-slate-500">Stake {bet.stake} NOP</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-indigo-600 shadow-sm">
                            x{bet.multiplier.toFixed(2)}
                          </span>
                          <span>{ahead > 0 ? `${ahead} cols ahead` : 'Evaluating now'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Recent wins & burns</div>
                <span className="text-[11px] text-slate-500">{recentResults.length} events</span>
              </div>
              {recentResults.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                  Results will appear once bets hit or expire.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentResults.map((bet) => (
                    <div
                      key={`${bet.id}-${bet.resolvedAt}`}
                      className="rounded-2xl border border-slate-100 bg-white px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">
                            C{bet.boxX + 1} · R{bet.boxY + 1}
                          </p>
                          <p className="text-[11px] text-slate-500">Stake {bet.stake} NOP</p>
                        </div>
                        <div
                          className={cn(
                            'text-sm font-semibold',
                            bet.status === 'won' ? 'text-emerald-500' : 'text-rose-500',
                          )}
                        >
                          {bet.status === 'won'
                            ? `+${(bet.payout ?? 0).toLocaleString()}`
                            : `-${bet.stake.toLocaleString()}`}{' '}
                          NOP
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
