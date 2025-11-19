import { ArrowDownCircle, ArrowUpCircle, ShoppingBag, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export type WalletAction = 'deposit' | 'withdraw' | 'buy' | 'send';

interface WalletActionMeta {
  key: WalletAction;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ActionBarProps {
  disabled?: boolean;
  onSelect: (action: WalletAction) => void;
}

const ACTIONS: WalletActionMeta[] = [
  {
    key: 'deposit',
    label: 'Deposit',
    description: 'Add liquidity to your portfolio',
    icon: ArrowDownCircle,
  },
  {
    key: 'withdraw',
    label: 'Withdraw',
    description: 'Move assets back to your wallet',
    icon: ArrowUpCircle,
  },
  {
    key: 'buy',
    label: 'Buy NOP',
    description: 'Swap USDT to NOP instantly',
    icon: ShoppingBag,
  },
  {
    key: 'send',
    label: 'Send',
    description: 'Transfer tokens to another address',
    icon: Send,
  },
];

export const ActionBar = ({ disabled, onSelect }: ActionBarProps) => {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
            <button
            key={action.key}
            type="button"
            onClick={() => onSelect(action.key)}
            disabled={disabled}
            className={cn(
                'group flex h-full flex-col rounded-2xl border border-border-subtle bg-surface p-5 text-left shadow-card-soft transition focus-visible:outline-none',
                'hover:-translate-y-0.5 hover:border-ring-subtle hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-[var(--color-accent-start)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]',
              disabled && 'pointer-events-none opacity-60'
            )}
          >
            <div className="flex items-center justify-between">
                <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-100">
                {action.label}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-gradient-soft)] text-indigo-600 shadow-inner">
                <Icon className="h-5 w-5 transition group-hover:scale-110" />
              </div>
            </div>
              <p className="mt-4 text-sm font-medium text-text-primary">{action.description}</p>
              <p className="mt-auto text-xs text-text-secondary">
              {action.key === 'buy' ? 'Slippage control 0.2%' : 'No hidden fees'}
            </p>
          </button>
        );
      })}
    </div>
  );
};
