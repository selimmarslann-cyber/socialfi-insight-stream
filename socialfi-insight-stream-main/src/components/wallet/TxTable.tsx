import { formatDistanceToNowStrict } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { WalletTx } from '@/types/wallet';
import { cn } from '@/lib/utils';

interface TxTableProps {
  transactions: WalletTx[];
}

const statusStyles: Record<
  WalletTx['status'],
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-700',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-100 text-emerald-700',
  },
  failed: {
    label: 'Failed',
    className: 'bg-rose-100 text-rose-700',
  },
};

const typeColors: Record<
  WalletTx['type'],
  { label: string; text: string; bg: string }
> = {
  deposit: {
    label: 'Deposit',
    text: 'text-cyan-700',
    bg: 'bg-cyan-50',
  },
  withdraw: {
    label: 'Withdraw',
    text: 'text-rose-700',
    bg: 'bg-rose-50',
  },
  buy: {
    label: 'Buy NOP',
    text: 'text-indigo-700',
    bg: 'bg-indigo-50',
  },
  sell: {
    label: 'Sell NOP',
    text: 'text-fuchsia-700',
    bg: 'bg-fuchsia-50',
  },
  send: {
    label: 'Send',
    text: 'text-slate-700',
    bg: 'bg-slate-50',
  },
  reward: {
    label: 'Reward',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
};

export const TxTable = ({ transactions }: TxTableProps) => {
  if (!transactions.length) {
    return (
      <div className="rounded-2xl border border-indigo-500/10 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-600">
          No transactions yet. Start by depositing assets or buying NOP.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-indigo-500/10 bg-white shadow-lg">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-6 py-3 text-left">Date</th>
            <th className="px-6 py-3 text-left">Type</th>
            <th className="px-6 py-3 text-left">Amount</th>
            <th className="hidden px-6 py-3 text-left md:table-cell">To / From</th>
            <th className="px-6 py-3 text-left">Tx</th>
            <th className="px-6 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {transactions.map((tx) => {
            const typeMeta = typeColors[tx.type];
            const statusMeta = statusStyles[tx.status];

            return (
              <tr key={tx.id} className="transition hover:bg-indigo-50/40">
                <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-700">
                  {formatDistanceToNowStrict(new Date(tx.timestamp), { addSuffix: true })}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                      typeMeta.bg,
                      typeMeta.text
                    )}
                  >
                    {typeMeta.label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">
                    {tx.direction === 'out' ? '-' : '+'}
                    {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                    <span className="text-xs font-medium text-slate-500">{tx.asset}</span>
                  </div>
                </td>
                <td className="hidden px-6 py-4 text-slate-500 md:table-cell">
                  {tx.counterparty ?? '—'}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500">
                  {tx.hash.slice(0, 6)}…{tx.hash.slice(-4)}
                </td>
                <td className="px-6 py-4">
                  <Badge
                    className={cn(
                      'rounded-full px-3 py-1 text-[11px] font-semibold',
                      statusMeta.className
                    )}
                  >
                    {statusMeta.label}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
