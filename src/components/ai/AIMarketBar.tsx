const MOCK_AI_MARKET = [
  { symbol: "BTC", sentiment: "Mild Bullish" },
  { symbol: "ETH", sentiment: "Neutral" },
  { symbol: "SOL", sentiment: "Bearish" },
  { symbol: "AI", sentiment: "Watchlist" },
] as const;

export function AIMarketBar() {
  return (
    <section className="rounded-2xl border border-indigo-500/10 bg-white/70 px-4 py-3 shadow-sm ring-1 ring-indigo-500/10">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          NOP Intelligence Layer · AI Market Scanner
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2 text-xs font-medium text-slate-600">
          {MOCK_AI_MARKET.map((item) => (
            <span
              key={item.symbol}
              className="inline-flex items-center gap-1 rounded-full border border-indigo-500/15 bg-indigo-50/60 px-3 py-1 text-[12px] text-indigo-700"
            >
              <span className="font-semibold">{item.symbol}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-600">{item.sentiment}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
