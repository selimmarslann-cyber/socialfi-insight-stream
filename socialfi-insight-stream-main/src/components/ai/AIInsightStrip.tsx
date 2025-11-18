interface AIInsightStripProps {
  signal?: string | null;
  volatility?: string | null;
  mmActivity?: string | null;
  score?: number | null;
}

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
    <span className="font-semibold text-slate-700">{value}</span>
  </div>
);

export const AIInsightStrip = ({ signal, volatility, mmActivity, score }: AIInsightStripProps) => {
  const formattedScore = typeof score === 'number' ? `${score}/100` : null;
  const metrics = [
    { label: 'AI Signal', value: signal?.trim() ?? '' },
    { label: 'Volatility', value: volatility?.trim() ?? '' },
    { label: 'MM Activity', value: mmActivity?.trim() ?? '' },
    { label: 'AI Score', value: formattedScore ?? '' },
  ];
  const hasInsight = metrics.some((metric) => metric.value.length > 0);

  return (
    <section className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
      {hasInsight ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {metrics.map((metric) => (
            <Metric key={metric.label} label={metric.label} value={metric.value || '—'} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">AI analysis pending for this insight.</p>
      )}
    </section>
  );
};

export default AIInsightStrip;
