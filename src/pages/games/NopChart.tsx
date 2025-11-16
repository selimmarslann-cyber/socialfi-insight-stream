import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { cn } from '../../lib/utils';

const COLS = 48;
const ROWS = 12;
const VIEWBOX_SIZE = 100;
const STEP_MS = 200; // 0.2s per step -> ~9.6s per full pass
const MIN_FORWARD_COLS = 2;
const MIN_STAKE = 10;
const START_BALANCE = 1000;
const MAX_RECENT_RESULTS = 8;

type Point = { x: number; y: number };

type BetStatus = 'active' | 'won' | 'lost';

type Bet = {
  id: string;
  boxX: number;
  boxY: number;
  stake: number;
  placedAt: number;
  segmentId: number;
  multiplier: number;
  status: BetStatus;
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

export default function NopChartGame() {
  const [points, setPoints] = useState<Point[]>([]);
  const [step, setStep] = useState(0);
  const [segmentId, setSegmentId] = useState(0);
  const [balance, setBalance] = useState(START_BALANCE);
  const [stake, setStake] = useState(MIN_STAKE);
  const [bets, setBets] = useState<Bet[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [segmentStartY, setSegmentStartY] = useState<number | null>(null);
  const [tenSecRefY, setTenSecRefY] = useState<number | null>(null);
  const [lastTenSecUpdatedAt, setLastTenSecUpdatedAt] = useState<number>(Date.now());

  const columnWidth = VIEWBOX_SIZE / COLS;
  const rowHeight = VIEWBOX_SIZE / ROWS;

  const head = points[points.length - 1] ?? null;
  const headColumn = head ? Math.round(head.x) : 0;
  const headRow = head ? rowIndexFromY(head.y) : Math.floor(ROWS / 2);
  const safeColumnThreshold = headColumn + MIN_FORWARD_COLS;

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
      const key = `${bet.boxX}-${bet.boxY}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [activeBets]);

  const linePoints = useMemo(
    () =>
      points
        .map((point) => `${(point.x / (COLS - 1)) * VIEWBOX_SIZE},${point.y}`)
        .join(' '),
    [points],
  );

  const totalDeltaPct =
    segmentStartY != null && segmentStartY !== 0 && head
      ? ((head.y - segmentStartY) / segmentStartY) * 100
      : 0;

  const lastTenSecDeltaPct =
    tenSecRefY != null && tenSecRefY !== 0 && head ? ((head.y - tenSecRefY) / tenSecRefY) * 100 : 0;

  const startNewSegment = useCallback(() => {
    const startY = randomBetween(20, 80);
    setPoints([{ x: 0, y: startY }]);
    setStep(0);
    setSegmentId((prev) => prev + 1);
    setSegmentStartY(startY);
    setTenSecRefY(startY);
    setLastTenSecUpdatedAt(Date.now());
  }, []);

  const resolveSegmentBets = useCallback((segmentToClose: number) => {
    setBets((prev) => {
      const now = Date.now();
      let changed = false;
      const next = prev.map((bet) => {
        if (bet.segmentId === segmentToClose && bet.status === 'active') {
          changed = true;
          return { ...bet, status: 'lost', resolvedAt: now, payout: 0 };
        }
        return bet;
      });
      return changed ? next : prev;
    });
  }, []);

  const handleSegmentEnd = useCallback(
    (segmentToClose: number) => {
      resolveSegmentBets(segmentToClose);
      startNewSegment();
    },
    [resolveSegmentBets, startNewSegment],
  );

  useEffect(() => {
    startNewSegment();
  }, [startNewSegment]);

  const hasStarted = points.length > 0;

  useEffect(() => {
    if (!hasStarted) return;
    const id = window.setInterval(() => {
      let advanced = false;
      setPoints((prev) => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        if (last.x >= COLS - 1) {
          return prev;
        }
        advanced = true;
        const nextX = Math.min(last.x + 1, COLS - 1);
        const pumpChance = Math.random();
        const deltaY = pumpChance < 0.15 ? randomBetween(-30, 30) : randomBetween(-8, 8);
        const nextY = clamp(last.y + deltaY, 0, 100);
        return [...prev, { x: nextX, y: nextY }];
      });

      if (advanced) {
        setStep((prev) => prev + 1);
      }
    }, STEP_MS);

    return () => window.clearInterval(id);
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    if (step >= COLS - 1) {
      handleSegmentEnd(segmentId);
    }
  }, [handleSegmentEnd, hasStarted, segmentId, step]);

  useEffect(() => {
    if (!head) return;
    const now = Date.now();
    if (now - lastTenSecUpdatedAt >= 10_000) {
      setTenSecRefY(head.y);
      setLastTenSecUpdatedAt(now);
    }
  }, [head, lastTenSecUpdatedAt]);

  useEffect(() => {
    if (!head) return;
    setBets((prev) => {
      const now = Date.now();
      let changed = false;
      let balanceDelta = 0;
      const next = prev.map((bet) => {
        if (bet.segmentId !== segmentId || bet.status !== 'active') {
          return bet;
        }

        if (bet.boxX === headColumn && bet.boxY === headRow) {
          const payout = Math.round(bet.stake * bet.multiplier);
          balanceDelta += payout;
          changed = true;
          return { ...bet, status: 'won', resolvedAt: now, payout };
        }

        if (step > bet.boxX) {
          changed = true;
          return { ...bet, status: 'lost', resolvedAt: now, payout: 0 };
        }

        return bet;
      });

      if (balanceDelta > 0) {
        setBalance((prevBalance) => prevBalance + balanceDelta);
      }

      return changed ? next : prev;
    });
  }, [head, headColumn, headRow, segmentId, step]);

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
      if (!head) return;
      if (stake < MIN_STAKE) {
        setWarning('Minimum stake is 10 NOP.');
        return;
      }
      if (balance < stake) {
        setWarning('Not enough NOP balance for this stake.');
        return;
      }
      if (boxX <= headColumn + MIN_FORWARD_COLS - 1) {
        setWarning('Place predictions at least two columns ahead of the glowing head.');
        return;
      }

      const multiplier = computeMultiplier({ headRow, headColumn, boxX, boxY });
      const newBet: Bet = {
        id: generateId(),
        boxX,
        boxY,
        stake,
        placedAt: Date.now(),
        segmentId,
        multiplier,
        status: 'active',
      };

      setBalance((prev) => prev - stake);
      setBets((prev) => [newBet, ...prev]);
      setWarning(null);
    },
    [balance, head, headColumn, headRow, segmentId, stake],
  );

  const gridRows = useMemo(() => Array.from({ length: ROWS }, (_, idx) => idx), []);
  const gridCols = useMemo(() => Array.from({ length: COLS }, (_, idx) => idx), []);

  const canPlace = balance >= stake && stake >= MIN_STAKE;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F5F8FF]">
      <div className="max-w-6xl mx-auto w-full py-6 px-4 lg:px-0 flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500">NOP Intelligence Layer</div>
            <div className="text-2xl font-semibold text-slate-900">NopChart — Live Time Game</div>
            <div className="text-[12px] text-slate-500">
              Predict the path of a moving line. Hit the box, win NOP. Miss, you burn it.
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
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Live chart</p>
                  <p className="text-sm font-semibold text-slate-900">Segment #{segmentId || 1}</p>
                </div>
                <div className="text-[11px] text-slate-500">~9s sweep · {COLS} cols</div>
              </div>
              <div className="relative">
                <svg className="w-full h-[65vh] max-h-[520px]" viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}>
                  <defs>
                    <linearGradient id="nopLine" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#22D3EE" />
                    </linearGradient>
                  </defs>
                  <rect
                    x={0}
                    y={0}
                    width={VIEWBOX_SIZE}
                    height={VIEWBOX_SIZE}
                    rx={16}
                    className="fill-white"
                  />
                  {head && (
                    <rect
                      x={0}
                      y={0}
                      width={Math.min(safeColumnThreshold, COLS) * columnWidth}
                      height={VIEWBOX_SIZE}
                      className="fill-slate-900/5"
                      opacity={0.35}
                      pointerEvents="none"
                    />
                  )}
                  <g>
                    {gridCols.map((col) =>
                      gridRows.map((row) => {
                        const key = `${col}-${row}`;
                        const x = col * columnWidth;
                        const y = VIEWBOX_SIZE - (row + 1) * rowHeight;
                        const isAhead = col >= safeColumnThreshold;
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
                              'stroke-slate-200/40 fill-sky-200/5 transition-colors duration-150',
                              isActive && 'fill-indigo-100/60 stroke-indigo-400/70',
                              canPlace && isAhead && 'cursor-pointer hover:fill-sky-200/20',
                              (!canPlace || !isAhead) && 'cursor-not-allowed opacity-60',
                            )}
                            strokeWidth={0.4}
                            onClick={() => (canPlace && isAhead ? handleBoxClick(col, row) : undefined)}
                          />
                        );
                      }),
                    )}
                  </g>
                  {points.length > 1 && (
                    <polyline
                      points={linePoints}
                      fill="none"
                      stroke="url(#nopLine)"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="drop-shadow-[0_8px_16px_rgba(79,70,229,0.25)]"
                    />
                  )}
                  {head && (
                    <circle
                      cx={(head.x / (COLS - 1)) * VIEWBOX_SIZE}
                      cy={head.y}
                      r={2.3}
                      className="fill-[#F5C76A] stroke-[#FBBF24]"
                      strokeWidth={0.7}
                    />
                  )}
                </svg>
                <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-600 shadow">
                  Safe zone: place bets ≥ {MIN_FORWARD_COLS} cols ahead
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
                Place predictions ahead of the moving line. If the line touches your box you are paid instantly based on distance.
                Once the column falls behind the head, the stake burns.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Live Δ%</div>
                <div className="text-[11px] text-slate-500">Segment ~10s</div>
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
                Distance to the line is the main risk. Forward columns add up to +25% bonus multiplier.
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Active bets</div>
                <span className="text-[11px] text-slate-500">{activeBets.length} live</span>
              </div>
              {activeBets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                  No live predictions. Tap a grid box ahead of the line to queue one.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeBets.slice(0, 6).map((bet) => (
                    <div
                      key={bet.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/60 px-3 py-2 text-sm"
                    >
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
                        <span>Segment #{bet.segmentId}</span>
                        <span>{bet.boxX - headColumn} cols ahead</span>
                      </div>
                    </div>
                  ))}
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
