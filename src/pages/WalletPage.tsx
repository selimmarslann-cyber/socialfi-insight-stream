import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton';
import { BalanceHeader } from '@/components/wallet/BalanceHeader';
import { ActionBar, WalletAction } from '@/components/wallet/ActionBar';
import { TokenCard } from '@/components/wallet/TokenCard';
import { TxTable } from '@/components/wallet/TxTable';
import { Badge } from '@/components/ui/badge';
import { useWalletStore } from '@/lib/store';
import type { WalletTx } from '@/types/wallet';
import { DashboardCard } from '@/components/layout/visuals/DashboardCard';
import { DashboardSectionTitle } from '@/components/layout/visuals/DashboardSectionTitle';

const tokenMeta = {
  USDT: {
    name: 'Tether USD',
    price: 1,
    change24h: 0.05,
  },
  NOP: {
    name: 'Network of Proof',
    price: 0.12,
    change24h: 4.8,
  },
};

const actionLabels: Record<WalletAction, string> = {
  deposit: 'Deposit',
  withdraw: 'Withdraw',
  buy: 'Buy NOP',
  send: 'Send',
};

export default function WalletPage() {
  const {
    connected,
    address,
    chainId,
    usdt,
    nop,
    transactions,
    setChainId,
    updateBalance,
    addTx,
  } = useWalletStore();
  const [activeAction, setActiveAction] = useState<WalletAction | null>(null);
  const [actionAmount, setActionAmount] = useState('');

  const totalUsd = useMemo(() => {
    const nopUsd = nop * tokenMeta.NOP.price;
    return usdt + nopUsd;
  }, [nop, usdt]);

  const stats = useMemo(
    () => [
      { label: '24h PnL', value: '+$840' },
      { label: 'Rewards accrued', value: `${(nop * 0.032).toFixed(0)} NOP` },
      { label: 'APY (staking)', value: '14.6%' },
    ],
    [nop]
  );

  const tokens = [
    {
      symbol: 'USDT' as const,
      name: tokenMeta.USDT.name,
      balance: usdt,
      price: tokenMeta.USDT.price,
      change24h: tokenMeta.USDT.change24h,
      available: usdt,
      allocation: totalUsd === 0 ? 0 : (usdt / totalUsd) * 100,
      locked: 0,
    },
    {
      symbol: 'NOP' as const,
      name: tokenMeta.NOP.name,
      balance: nop,
      price: tokenMeta.NOP.price,
      change24h: tokenMeta.NOP.change24h,
      available: Math.max(0, nop - 2600),
      allocation: totalUsd === 0 ? 0 : ((nop * tokenMeta.NOP.price) / totalUsd) * 100,
      locked: Math.min(nop, 2600),
    },
  ];

  const onCloseDialog = () => {
    setActiveAction(null);
    setActionAmount('');
  };

  const handleActionSelect = (action: WalletAction) => {
    if (!connected) {
      toast.info('Connect your wallet to continue');
      return;
    }
    setActiveAction(action);
  };

  const handleSubmit = () => {
    if (!activeAction) return;
    const amountValue = Number(actionAmount);
    if (!amountValue || amountValue <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (activeAction === 'withdraw' || activeAction === 'send') {
      const availableBalance = activeAction === 'send' ? usdt : nop;
      if (amountValue > availableBalance) {
        toast.error('Amount exceeds available balance');
        return;
      }
    }

    if (activeAction === 'buy') {
      const requiredUsdt = amountValue * tokenMeta.NOP.price;
      if (requiredUsdt > usdt) {
        toast.error('Not enough USDT to buy that amount of NOP');
        return;
      }
      updateBalance(usdt - requiredUsdt, nop + amountValue);
    }

    if (activeAction === 'deposit') {
      updateBalance(usdt + amountValue, nop);
    }

    if (activeAction === 'withdraw') {
      updateBalance(usdt, Math.max(0, nop - amountValue));
    }
    if (activeAction === 'send') {
      updateBalance(Math.max(0, usdt - amountValue), nop);
    }

    const newTx: WalletTx = {
      id: `tx-${Date.now()}`,
      hash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random()
        .toString(16)
        .slice(2, 6)}`,
      type:
        activeAction === 'buy'
          ? 'buy'
          : activeAction === 'deposit'
          ? 'deposit'
          : activeAction === 'withdraw'
          ? 'withdraw'
          : 'send',
      asset: activeAction === 'buy' || activeAction === 'withdraw' ? 'NOP' : 'USDT',
      amount: amountValue,
      direction: activeAction === 'withdraw' || activeAction === 'send' ? 'out' : 'in',
      timestamp: new Date().toISOString(),
      status: 'pending',
      note: `${actionLabels[activeAction]} via dashboard`,
    };

    addTx(newTx);
    toast.success(`${actionLabels[activeAction]} request created`);
    onCloseDialog();
  };

    if (!connected) {
      return (
        <div className="mx-auto max-w-3xl space-y-5 py-10 text-center">
          <DashboardCard className="space-y-4">
            <DashboardSectionTitle label="Wallet" title="Connect your wallet" />
            <p className="text-sm text-slate-600">
              Preview balances, yield analytics, and transaction history by connecting your wallet securely.
            </p>
            <div className="flex justify-center">
              <WalletConnectButton />
            </div>
          </DashboardCard>
        </div>
      );
    }

    return (
      <div className="space-y-6 py-6">
        <section className="space-y-3">
          <DashboardSectionTitle label="Wallet" title="Your NOP Intelligence Wallet" />
          <BalanceHeader
            address={address}
            totalUsd={totalUsd}
            totalNop={nop}
            usdtBalance={usdt}
            nopBalance={nop}
            chainId={chainId}
            onChainChange={setChainId}
            stats={stats}
          />
        </section>

        <DashboardCard className="space-y-4">
          <DashboardSectionTitle label="Actions" title="Boost your portfolio" />
          <ActionBar disabled={!connected} onSelect={handleActionSelect} />
        </DashboardCard>

        <section className="grid gap-4 md:grid-cols-2">
          {tokens.map((token) => (
            <TokenCard key={token.symbol} {...token} />
          ))}
        </section>

        <DashboardCard className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DashboardSectionTitle label="History" title="Transactions" />
            <Badge variant="secondary" className="rounded-full bg-slate-100 text-xs text-slate-600">
              Updated {format(new Date(), 'HH:mm')}
            </Badge>
          </div>
          <TxTable transactions={transactions} />
        </DashboardCard>

        <Dialog open={Boolean(activeAction)} onOpenChange={(open) => (!open ? onCloseDialog() : null)}>
          {activeAction && (
            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>{actionLabels[activeAction]}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={actionAmount}
                    onChange={(event) => setActionAmount(event.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <Button type="button" className="w-full" onClick={handleSubmit}>
                  Confirm {actionLabels[activeAction]}
                </Button>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </div>
    );
}
