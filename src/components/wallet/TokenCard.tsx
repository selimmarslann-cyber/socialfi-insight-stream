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
      <article className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface p-5 shadow-card-soft transition hover:-translate-y-0.5 hover:bg-surface-muted">
      <div className="flex items-center justify-between">
        <div>
            <p className="text-xs uppercase tracking-wide text-text-muted">Holding</p>
            <h3 className="text-lg font-semibold text-text-primary">
              {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
              <span className="text-sm font-normal text-text-secondary">{symbol}</span>
          </h3>
        </div>
          <Badge variant="secondary" className="rounded-full bg-surface-muted text-xs font-semibold text-text-primary">
          {name}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-border-subtle bg-surface-muted p-3">
            <p className="text-[11px] uppercase tracking-wide text-text-muted">Spot price</p>
            <div className="mt-1 text-base font-semibold text-text-primary">
            ${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </div>
          <div
            className={cn(
              'mt-1 flex items-center gap-1 text-xs font-medium',
              isPositive ? 'text-emerald-500' : 'text-rose-500'
            )}
          >
            {isPositive ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
              {isPositive ? "+" : ""}
            {change24h.toFixed(2)}%
              <span className="text-text-muted">24h</span>
          </div>
        </div>

          <div className="rounded-xl border border-border-subtle bg-surface-muted p-3">
            <p className="text-[11px] uppercase tracking-wide text-text-muted">Allocation</p>
            <div className="mt-1 text-base font-semibold text-text-primary">{allocation.toFixed(1)}%</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-text-secondary">
            <Dot className="h-5 w-5 text-cyan-500" />
            {available.toLocaleString(undefined, { maximumFractionDigits: 1 })} available
          </div>
        </div>
      </div>

        <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-secondary">
        <span>Locked for yield</span>
        <span className="font-semibold">
            {(locked ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
            <span className="text-xs font-normal text-text-muted">{symbol}</span>
        </span>
      </div>
    </article>
  );
};
