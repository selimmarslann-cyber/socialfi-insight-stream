import { useMemo } from 'react';
import { Wallet, Copy, Sparkle, Activity, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StatChip {
  label: string;
  value: string;
  hint?: string;
  trend?: 'up' | 'down';
}

interface ChainOption {
  id: number;
  label: string;
  ecosystem: string;
}

interface BalanceHeaderProps {
  address?: string;
  totalUsd: number;
  totalNop: number;
  usdtBalance: number;
  nopBalance: number;
  chainId?: number;
  onChainChange: (chainId: number) => void;
  stats: StatChip[];
  disabled?: boolean;
  className?: string;
}

const chainOptions: ChainOption[] = [
  { id: 324, label: 'zkSync Era', ecosystem: 'Layer 2' },
  { id: 8453, label: 'Base', ecosystem: 'Layer 2' },
  { id: 59144, label: 'Linea', ecosystem: 'Layer 2' },
];

export const BalanceHeader = ({
  address,
  totalUsd,
  totalNop,
  usdtBalance,
  nopBalance,
  chainId = 324,
  onChainChange,
  stats,
  disabled,
  className,
}: BalanceHeaderProps) => {
  const maskedAddress = useMemo(() => {
    if (!address) return 'Connect wallet';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  const copyAddress = () => {
    if (!address) {
      toast.info('Wallet not connected');
      return;
    }
    navigator.clipboard.writeText(address);
    toast.success('Address copied');
  };

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl p-6 text-white shadow-xl transition hover:shadow-2xl',
        className
      )}
      style={{ backgroundImage: 'var(--brand-gradient)' }}
    >
      <div className="absolute inset-0 opacity-30 mix-blend-screen">
        <div className="absolute -left-40 top-10 h-64 w-64 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-cyan-300/40 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide">
              Portfolio
            </span>
            <Badge className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
              <ShieldCheck className="h-3.5 w-3.5" />
              zkSync verified
            </Badge>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">
              Total value locked
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-4">
              <h1 className="text-4xl font-semibold md:text-5xl">
                ${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h1>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Sparkle className="h-4 w-4" />
                <span>{totalNop.toLocaleString()} NOP</span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-white/70">Available USDT</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-semibold">
                  {usdtBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-white/60">USDT</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-white/70">Available NOP</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-semibold">
                  {nopBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-xs text-white/60">NOP</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">Connected wallet</p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>{maskedAddress}</span>
                <button
                  type="button"
                  className="rounded-full border border-white/20 bg-white/10 p-1 text-white/80 transition hover:bg-white/20"
                  onClick={copyAddress}
                  aria-label="Copy address"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-white/70">Network</p>
            <Select value={String(chainId)} onValueChange={(value) => onChainChange(Number(value))} disabled={disabled}>
              <SelectTrigger className="h-12 rounded-xl border-white/20 bg-white/10 text-sm font-medium text-white shadow-none hover:bg-white/15 focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Select chain" />
              </SelectTrigger>
              <SelectContent className="overflow-hidden rounded-xl border border-indigo-500/20 bg-white shadow-xl">
                {chainOptions.map((option) => (
                  <SelectItem key={option.id} value={String(option.id)}>
                    <div className="flex flex-col">
                      <span className="font-medium text-[#0F172A]">{option.label}</span>
                      <span className="text-xs text-slate-500">{option.ecosystem}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm"
              >
                <span className="text-white/70">{stat.label}</span>
                <span className="font-semibold">{stat.value}</span>
              </div>
            ))}
          </div>

          <Button
            variant="secondary"
            className="h-11 rounded-xl bg-white/90 text-[#0F172A] transition hover:scale-[1.01] hover:bg-white"
            onClick={copyAddress}
            disabled={disabled}
          >
            <Activity className="mr-2 h-4 w-4" />
            View on explorer
          </Button>
        </div>
      </div>
    </section>
  );
};
