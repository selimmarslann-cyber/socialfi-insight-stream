import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';

const VIEW_WIDTH = 120;
const VIEW_HEIGHT = 100;
const COLS = 10;
const ROWS = 8;
const ROW_HEIGHT = VIEW_HEIGHT / ROWS;
const COL_WIDTH = VIEW_WIDTH / COLS;
const INITIAL_POINTS = 80;
const MAX_POINTS = 120;
const POINT_INTERVAL = 120; // ms
const ROUND_DURATION = 10; // seconds
const START_BALANCE = 1000;
const MIN_STAKE = 10;

type Point = { x: number; y: number; t: number };
type ScreenPoint = Point & { screenX: number; screenY: number };

type Bet = {
  id: string;
  boxX: number;
  boxY: number;
  stake: number;
  placedAt: number;
  resolved: boolean;
  roundId: number;
  distance: number;
  multiplier: number | 'refund';
  hit?: boolean;
  hitTimestamp?: number;
  payout?: number;
  resolvedAt?: number;
};

type BetSummary = {
  count: number;
  hit: boolean;
  multiplierLabel: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const randomDelta = () => Math.floor(Math.random() * 13) - 6; // -6..+6

const randomId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const generateInitialPoints = (): Point[] => {
  const now = Date.now();
  const start = now - INITIAL_POINTS * POINT_INTERVAL;
  let currentY = 50;
  const next: Point[] = [];

  for (let i = 0; i < INITIAL_POINTS; i += 1) {
    const t = start + i * POINT_INTERVAL;
    next.push({ x: i, y: currentY, t });
    currentY = clamp(currentY + randomDelta(), 10, 90);
  }

  return next;
};

const rowIndexFromY = (y: number) => {
  const safe = clamp(y, 0, VIEW_HEIGHT - 0.001);
  return Math.min(ROWS - 1, Math.max(0, Math.floor(safe / ROW_HEIGHT)));
};

const getMultiplier = (distance: number): number | 'refund' => {
  if (distance === 0) return 'refund';
  if (distance === 1) return 1.3;
  if (distance === 2) return 1.7;
  if (distance === 3) return 2.2;
  if (distance === 4) return 3.0;
  return 3.5;
};

const formatMultiplierBadge = (multiplier: number | 'refund') => {
  if (multiplier === 'refund') return '↺';
  return `x${multiplier.toFixed(1)}`;
};

const formatPayout = (value?: number) => (value ? value.toLocaleString() : '0');

export default function NopChartGame() {
  const [points, setPoints] = useState<Point[]>(() => generateInitialPoints());
  const [balance, setBalance] = useState(START_BALANCE);
  const [stake, setStake] = useState(MIN_STAKE);
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [betHistory, setBetHistory] = useState<Bet[]>([]);
  const [roundId, setRoundId] = useState(1);
  const [roundTimeLeft, setRoundTimeLeft] = useState(ROUND_DURATION);
  const [warning, setWarning] = useState<string | null>(null);

  const normalizedPoints = useMemo<ScreenPoint[]>(() => {
    if (!points.length) return [];
    const minX = points[0].x;
    const maxX = points[points.length - 1].x;
    const span = Math.max(maxX - minX, 1);

    return points.map((point) => ({
      ...point,
      screenX: ((point.x - minX) / span) * VIEW_WIDTH,
      screenY: point.y,
    }));
  }, [points]);

  const latestPoint = normalizedPoints[normalizedPoints.length - 1];
  const currentRow = latestPoint ? rowIndexFromY(latestPoint.screenY) : Math.floor(ROWS / 2);

  const betGroups = useMemo(() => {
    const map = new Map<string, BetSummary>();
    activeBets.forEach((bet) => {
      const key = `${bet.boxX}-${bet.boxY}`;
      const badge = formatMultiplierBadge(bet.multiplier);
      const existing = map.get(key);
      map.set(key, {
        count: (existing?.count ?? 0) + 1,
        hit: Boolean(bet.hit) || existing?.hit === true,
        multiplierLabel: existing?.multiplierLabel ?? badge,
      });
    });
    return map;
  }, [activeBets]);

  const handleStakeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = Number(event.target.value);
    if (Number.isNaN(raw)) {
      setStake(MIN_STAKE);
      return;
    }
    const normalized = Math.max(MIN_STAKE, Math.round(raw / 10) * 10);
    const maxAllowed = balance >= MIN_STAKE ? balance : MIN_STAKE;
    const nextStake = Math.min(maxAllowed, normalized);
    setStake(nextStake);
  };

  const placeBet = (boxX: number, boxY: number) => {
    let accepted = false;
    setBalance((prev) => {
      if (prev < stake) {
        return prev;
      }
      accepted = true;
      return prev - stake;
    });

    if (!accepted) {
      setWarning('Not enough NOP balance for this stake.');
      return;
    }
    setWarning(null);

    const distance = Math.abs(boxY - currentRow);
    const multiplier = getMultiplier(distance);
    const bet: Bet = {
      id: randomId(),
      boxX,
      boxY,
      stake,
      placedAt: Date.now(),
      resolved: false,
      roundId,
      distance,
      multiplier,
    };

    setActiveBets((prev) => [...prev, bet]);
  };

  const resolveRound = useCallback(() => {
    setActiveBets((prevBets) => {
      if (!prevBets.length) return prevBets;

      const roundEnd = Date.now();
      const resolvedBets = prevBets.map((bet) => {
        const multiplier = bet.multiplier ?? getMultiplier(bet.distance);
        let payout = 0;

        if (multiplier === 'refund') {
          payout = bet.stake;
        } else if (bet.hit) {
          payout = Math.round(bet.stake * multiplier);
        }

        return {
          ...bet,
          hit: Boolean(bet.hit),
          payout,
          resolved: true,
          resolvedAt: roundEnd,
        };
      });

      const totalReturn = resolvedBets.reduce((acc, bet) => acc + (bet.payout ?? 0), 0);
      if (totalReturn > 0) {
        setBalance((prevBalance) => prevBalance + totalReturn);
      }
      setBetHistory((history) => [...resolvedBets, ...history].slice(0, 8));
      return [];
    });
    setRoundId((prev) => prev + 1);
    setRoundTimeLeft(ROUND_DURATION);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRoundTimeLeft((prev) => (prev > 0 ? prev - 1 : prev));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (roundTimeLeft === 0) {
      resolveRound();
    }
  }, [roundTimeLeft, resolveRound]);

  useEffect(() => {
    if (balance >= MIN_STAKE && stake > balance) {
      setStake(balance);
    }
  }, [balance, stake]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPoints((prev) => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        const nextY = clamp(last.y + randomDelta(), 10, 90);
        const nextPoint: Point = { x: last.x + 1, y: nextY, t: Date.now() };
        const combined = [...prev, nextPoint];
        return combined.length > MAX_POINTS ? combined.slice(combined.length - MAX_POINTS) : combined;
      });
    }, POINT_INTERVAL);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!normalizedPoints.length) return;

    setActiveBets((prev) => {
      if (!prev.length) return prev;
      let changed = false;
      const next = prev.map((bet) => {
        if (bet.hit) return bet;
        const boxXStart = bet.boxX * COL_WIDTH;
        const boxXEnd = boxXStart + COL_WIDTH;
        const boxYStart = bet.boxY * ROW_HEIGHT;
        const boxYEnd = boxYStart + ROW_HEIGHT;

        const hitPoint = normalizedPoints.find(
          (point) =>
            point.t >= bet.placedAt &&
            point.screenX >= boxXStart &&
            point.screenX <= boxXEnd &&
            point.screenY >= boxYStart &&
            point.screenY <= boxYEnd,
        );

        if (hitPoint) {
          changed = true;
          return { ...bet, hit: true, hitTimestamp: hitPoint.t };
        }
        return bet;
      });
      return changed ? next : prev;
    });
  }, [normalizedPoints]);

  const chartPoints = useMemo(
    () => normalizedPoints.map((point) => `${point.screenX},${point.screenY}`).join(' '),
    [normalizedPoints],
  );

  const BoxGrid = () => {
    const rows = Array.from({ length: ROWS }, (_, idx) => idx);
    const columns = Array.from({ length: COLS }, (_, idx) => idx);

    return (
      <g>
        {rows.map((row) => (
          <line
            key={`row-${row}`}
            x1={0}
            x2={VIEW_WIDTH}
            y1={row * ROW_HEIGHT}
            y2={row * ROW_HEIGHT}
            stroke="rgba(148, 163, 184, 0.25)"
            strokeWidth={0.2}
          />
        ))}
        {columns.map((col) => (
          <line
            key={`col-${col}`}
            y1={0}
            y2={VIEW_HEIGHT}
            x1={col * COL_WIDTH}
            x2={col * COL_WIDTH}
            stroke="rgba(148, 163, 184, 0.18)"
            strokeWidth={0.2}
          />
        ))}
        {rows.map((row) =>
          columns.map((col) => {
            const key = `${col}-${row}`;
            const summary = betGroups.get(key);
            const isActive = Boolean(summary);
            const fill = isActive ? 'rgba(79, 70, 229, 0.08)' : 'rgba(125, 211, 252, 0.08)';
            const stroke = isActive ? 'rgba(79, 70, 229, 0.8)' : 'rgba(148, 163, 184, 0.4)';
            return (
              <g key={key}>
                <rect
                  x={col * COL_WIDTH + 0.3}
                  y={row * ROW_HEIGHT + 0.3}
                  width={COL_WIDTH - 0.6}
                  height={ROW_HEIGHT - 0.6}
                  rx={1.8}
                  ry={1.8}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={0.4}
                  style={{ cursor: balance >= stake ? 'pointer' : 'not-allowed', transition: 'all 150ms ease' }}
                  onClick={() => placeBet(col, row)}
                  onMouseEnter={(event) => {
                    event.currentTarget.setAttribute('fill', 'rgba(59, 130, 246, 0.18)');
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.setAttribute('fill', fill);
                  }}
                />
                {summary && (
                  <text
                    x={(col + 1) * COL_WIDTH - 1.6}
                    y={row * ROW_HEIGHT + 4}
                    textAnchor="end"
                    fontSize="3.2"
                    fill="rgba(79, 70, 229, 0.9)"
                  >
                    {summary.multiplierLabel} · {summary.count}x
                  </text>
                )}
              </g>
            );
          }),
        )}
      </g>
    );
  };

  const ActiveBetsList = () => (
    <div className="space-y-3">
      {activeBets.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 p-3 text-sm text-slate-500">
          No active predictions. Tap a grid box to place a NOP bet.
        </div>
      )}
      {activeBets.map((bet) => (
        <div
          key={bet.id}
          className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50/40 p-3 text-sm ring-1 ring-indigo-500/10"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800">
              Box {bet.boxX + 1} · Row {bet.boxY + 1}
            </span>
            <span className="text-xs text-slate-500">Stake {bet.stake} NOP</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold text-indigo-600 shadow-sm ring-1 ring-indigo-100">
              {bet.multiplier === 'refund' ? 'Low risk · refund' : `x${bet.multiplier.toFixed(1)} reward`}
            </span>
            <span>Distance {bet.distance}</span>
            <span className={bet.hit ? 'text-emerald-600 font-semibold' : 'text-[inherit]'}>
              {bet.hit ? 'Line touched' : 'Waiting for touch'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  const RecentResults = () => (
    <div className="space-y-3">
      {betHistory.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 p-3 text-sm text-slate-500">
          Round history will appear here once bets settle.
        </div>
      )}
      {betHistory.map((bet) => (
        <div
          key={`${bet.id}-${bet.resolvedAt}`}
          className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 text-sm ring-1 ring-slate-100"
        >
          <div>
            <div className="font-semibold text-slate-800">
              Box {bet.boxX + 1} · Row {bet.boxY + 1}
            </div>
            <div className="text-xs text-slate-500">
              Round #{bet.roundId} · Stake {bet.stake} NOP
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-sm font-semibold ${
                bet.hit ? 'text-emerald-600' : bet.multiplier === 'refund' ? 'text-amber-500' : 'text-rose-500'
              }`}
            >
              {bet.hit ? `+${formatPayout(bet.payout)} NOP` : bet.multiplier === 'refund' ? 'Refunded' : `-${bet.stake} NOP`}
            </div>
            <div className="text-xs text-slate-400">{bet.hit ? 'Hit' : 'Miss'}</div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm ring-1 ring-indigo-500/10">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
              Mini Game · DeFi Arcade
            </div>
            <h1 className="text-3xl font-semibold text-slate-900">NopChart</h1>
            <p className="text-sm text-slate-500">
              TradingView-like moving line game. Place NOP on prediction boxes. If the line touches your box, you win.
              Closer boxes refund, farther boxes pay more.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm ring-1 ring-indigo-500/15">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Live Chart</p>
                  <p className="text-sm font-semibold text-slate-800">Round #{roundId}</p>
                </div>
                <div className="rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 px-3 py-1 text-xs font-semibold text-white shadow">
                  Ends in {roundTimeLeft}s
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-4 shadow-inner">
                <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="h-64 w-full select-none">
                  <defs>
                    <linearGradient id="nopChartLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#22D3EE" />
                    </linearGradient>
                    <linearGradient id="nopChartGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(99,102,241,0.28)" />
                      <stop offset="100%" stopColor="rgba(14,165,233,0.05)" />
                    </linearGradient>
                  </defs>
                  <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} rx={12} fill="url(#nopChartGlow)" opacity={0.4} />
                  <BoxGrid />
                  {normalizedPoints.length > 1 && (
                    <polyline
                      points={chartPoints}
                      fill="none"
                      stroke="url(#nopChartLineGradient)"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="drop-shadow-[0_4px_12px_rgba(79,70,229,0.35)]"
                    />
                  )}
                  {latestPoint && (
                    <circle
                      cx={latestPoint.screenX}
                      cy={latestPoint.screenY}
                      r={2.6}
                      fill="#F5C76A"
                      stroke="#FBBF24"
                      strokeWidth={0.6}
                    />
                  )}
                </svg>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm ring-1 ring-indigo-500/10">
              <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Account</p>
                  <p className="text-lg font-semibold text-slate-900">
                    Balance: <span className="text-amber-500">{balance.toLocaleString()} NOP</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-500" htmlFor="stake-input">
                    Stake per prediction
                  </label>
                  <input
                    id="stake-input"
                    type="number"
                    min={MIN_STAKE}
                    step={10}
                    value={stake}
                    onChange={handleStakeChange}
                    className="h-11 w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 text-right text-sm font-semibold text-slate-800 shadow-inner focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>
              {warning && <p className="mt-3 rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600">{warning}</p>}
              <p className="mt-3 text-sm text-slate-500">
                Click on any boxes to place NOP. The line must touch your box before the round ends. Same-row bets refund; farther rows increase multiplier.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm ring-1 ring-indigo-500/10">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">Active Predictions</p>
                <span className="text-xs text-slate-400">{activeBets.length} bets</span>
              </div>
              <ActiveBetsList />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm ring-1 ring-indigo-500/10 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Round status</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {roundTimeLeft}s <span className="text-base text-slate-400">remaining</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-center">
                  <p className="text-xs text-slate-500">Round</p>
                  <p className="text-lg font-semibold text-indigo-600">#{roundId}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-center">
                  <p className="text-xs text-slate-500">Active bets</p>
                  <p className="text-lg font-semibold text-slate-900">{activeBets.length}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                Line touches a prediction box → bet is marked as hit. Payouts trigger when the round timer resets.
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm ring-1 ring-indigo-500/10">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">Recent Results</p>
                <span className="text-xs text-slate-400">{betHistory.length} settled</span>
              </div>
              <RecentResults />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
