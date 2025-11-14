type AIInsightStripProps = {
  signal?: string | null;
  volatility?: string | null;
  mmActivity?: string | null;
  score?: number | string | null;
};

const METRIC_LABELS = [
  { key: "signal", label: "AI Signal" },
  { key: "volatility", label: "Volatility" },
  { key: "mmActivity", label: "MM Activity" },
  { key: "score", label: "AI Score" },
] as const;

export function AIInsightStrip({
  signal,
  volatility,
  mmActivity,
  score,
}: AIInsightStripProps) {
  const values: Record<string, string> = {
    signal: coerceValue(signal),
    volatility: coerceValue(volatility),
    mmActivity: coerceValue(mmActivity),
    score: coerceValue(score),
  };

  const hasData = Object.values(values).some(Boolean);

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      {hasData ? (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-slate-500">
          {METRIC_LABELS.map(({ key, label }) => {
            const value = values[key];
            if (!value) return null;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">{label}:</span>
                <span>{value}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          AI analysis pending for this insight.
        </p>
      )}
    </div>
  );
}

function coerceValue(value?: string | number | null) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return `${value}`;
  return value.trim();
}
