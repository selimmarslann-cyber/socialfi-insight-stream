import { ArrowDown, ArrowUp, Dot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TokenCardProps {
  symbol: 'USDT' | 'NOP';
  name: string;
  balance: number;
  price: number;
  change24h: number;
  available: number;
  allocation: number;
  locked?: number;
}

export const TokenCard = ({
  symbol,
  name,
  balance,
  price,
  change24h,
  available,
  allocation,
  locked,
}: TokenCardProps) => {
  const isPositive = change24h >= 0;

  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-lg ring-1 ring-indigo-500/10 transition hover:-translate-y-0.5 hover:ring-indigo-500/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Holding</p>
          <h3 className="text-lg font-semibold text-slate-900">
            {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
            <span className="text-sm font-normal text-slate-500">{symbol}</span>
          </h3>
        </div>
        <Badge variant="secondary" className="rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
          {name}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-indigo-500/10 bg-slate-50 p-3">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Spot price</p>
          <div className="mt-1 text-base font-semibold text-slate-900">
            ${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </div>
          <div
            className={cn(
              'mt-1 flex items-center gap-1 text-xs font-medium',
              isPositive ? 'text-emerald-500' : 'text-rose-500'
            )}
          >
            {isPositive ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
            {isPositive ? '+' : ''}
            {change24h.toFixed(2)}%
            <span className="text-slate-400">24h</span>
          </div>
        </div>

        <div className="rounded-xl border border-indigo-500/10 bg-slate-50 p-3">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Allocation</p>
          <div className="mt-1 text-base font-semibold text-slate-900">{allocation.toFixed(1)}%</div>
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <Dot className="h-5 w-5 text-cyan-500" />
            {available.toLocaleString(undefined, { maximumFractionDigits: 1 })} available
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <span>Locked for yield</span>
        <span className="font-semibold">
          {(locked ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
          <span className="text-xs font-normal text-slate-500">{symbol}</span>
        </span>
      </div>
    </article>
  );
};
