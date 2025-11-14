import { Badge } from '@/components/ui/badge';

type SentimentTone = 'bullish' | 'mild-bullish' | 'neutral' | 'bearish';

type MarketPill = {
  symbol: string;
  outlook: string;
  tone: SentimentTone;
};

const MOCK_AI_MARKET: MarketPill[] = [
  { symbol: 'BTC', outlook: 'Mild Bullish', tone: 'mild-bullish' },
  { symbol: 'ETH', outlook: 'Neutral', tone: 'neutral' },
  { symbol: 'SOL', outlook: 'Bearish', tone: 'bearish' },
  { symbol: 'NOP', outlook: 'Accumulating', tone: 'bullish' },
];

const toneClassMap: Record<SentimentTone, string> = {
  bullish: 'text-emerald-600 bg-emerald-50/70 border-emerald-100',
  'mild-bullish': 'text-teal-600 bg-teal-50/70 border-teal-100',
  neutral: 'text-slate-600 bg-slate-50/80 border-slate-100',
  bearish: 'text-rose-600 bg-rose-50/70 border-rose-100',
};

export const AIMarketBar = () => {
  return (
    <section className="rounded-2xl border border-indigo-500/10 bg-white/80 p-4 shadow-sm ring-1 ring-indigo-500/5 backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <Badge className="rounded-full bg-indigo-500/10 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
            AI
          </Badge>
          <span className="font-medium text-slate-800">
            NOP Intelligence Layer · AI Market Scanner
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {MOCK_AI_MARKET.map((pill) => (
            <span
              key={pill.symbol}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${toneClassMap[pill.tone]}`}
            >
              <span className="text-slate-800">{pill.symbol}</span>
              <span className="text-[11px] uppercase tracking-wide">{pill.outlook}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AIMarketBar;
