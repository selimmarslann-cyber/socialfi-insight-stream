import { useCallback, useEffect, useMemo, useState, useId } from "react";
import type { BurnStats } from "@/types/admin";

const BURN_ENDPOINT = "/api/burn";
const DIGIT_COUNT = 8;

export default function TokenBurn() {
  const [data, setData] = useState<BurnStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(BURN_ENDPOINT, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`burn_${response.status}`);
      }
      const payload = (await response.json()) as BurnStats;
      setData(payload);
    } catch (err) {
      console.error("Token burn fetch failed", err);
      setData(null);
      setError("Yakım verisi alınamadı.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalValue = useMemo(() => {
    if (typeof data?.total !== "number" || Number.isNaN(data.total)) {
      return 0;
    }
    return Math.max(0, Math.floor(data.total));
  }, [data?.total]);

  const digits = useMemo(() => {
    const formatted = totalValue.toString().padStart(DIGIT_COUNT, "0");
    return formatted.slice(-DIGIT_COUNT).split("");
  }, [totalValue]);

  const valueLabel = useMemo(
    () => totalValue.toLocaleString("en-US"),
    [totalValue],
  );

  return (
    <section
      className="rounded-2xl bg-white shadow-sm border border-slate-100 p-6 flex flex-col items-center gap-4 w-full text-center dark:bg-slate-900 dark:border-slate-700"
      aria-busy={loading}
      aria-live="polite"
    >
      <FlameIcon />
      <div className="flex flex-col items-center gap-1">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          NOP Burn Counter
        </h3>
        {loading ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {data ? "Refreshing…" : "Updating…"}
          </span>
        ) : null}
      </div>

      <div
        className="mt-1 w-full rounded-xl bg-slate-50 border border-indigo-100 px-4 py-3 flex gap-1 justify-center dark:bg-slate-800 dark:border-slate-700"
        aria-label="Burn digits counter"
      >
        {digits.map((digit, index) => (
          <span
            key={`${digit}-${index}`}
            className={`w-6 h-8 rounded-md bg-white shadow-xs flex items-center justify-center text-sm font-mono font-semibold text-amber-500 border border-amber-100 dark:bg-slate-900 dark:border-amber-400/40 dark:text-amber-400 ${
              loading ? "animate-pulse" : ""
            }`}
          >
            {digit}
          </span>
        ))}
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Total burned
        </div>
        <div className="text-xl font-semibold text-amber-500 tracking-wide dark:text-amber-400">
          {valueLabel} NOP
        </div>
      </div>

      {error ? (
        <div className="w-full rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-2 text-sm text-rose-600 dark:border-rose-400/40 dark:bg-rose-500/20">
          <p>{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-2 text-sm font-semibold text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400"
          >
            Retry
          </button>
        </div>
      ) : null}
    </section>
  );
}

const FlameIcon = () => {
  const gradientId = useId();
  const flameGradientId = `${gradientId}-flame`;
  const innerGradientId = `${gradientId}-inner`;

  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-lg">
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        role="img"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={flameGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c7d2fe" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id={innerGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
        </defs>
        <path
          d="M12.153 2.119c-.297-.531-1.009-.531-1.306 0C7.05 8.18 6.25 10.984 6.25 12.75c0 3.728 2.77 6.5 5.75 6.5s5.75-2.772 5.75-6.5c0-1.766-.8-4.57-4.597-10.631z"
          fill={`url(#${flameGradientId})`}
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="0.4"
        />
        <path
          d="M12 9.2c-1.3 1.7-2 3.06-2 4.4 0 1.74 1.12 3.1 2 3.1s2-1.36 2-3.1c0-1.34-.7-2.7-2-4.4z"
          fill={`url(#${innerGradientId})`}
        />
      </svg>
    </div>
  );
};
