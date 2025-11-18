import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { useWalletStore } from '@/lib/store';
import type { WalletTx } from '@/types/wallet';
import { DashboardCard } from '@/components/layout/visuals/DashboardCard';
import { DashboardSectionTitle } from '@/components/layout/visuals/DashboardSectionTitle';
import { computeProtocolFee } from '@/lib/protocol/fees';
import { fetchUserSocialPositions } from '@/lib/protocol/positions';
import { fetchReputationScore } from '@/lib/protocol/reputation';
import { StatusPill } from '@/components/ui/status-pill';

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

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

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

  const positionsQuery = useQuery({
    queryKey: ['social-positions', address],
    queryFn: () => fetchUserSocialPositions(address ?? ''),
    enabled: Boolean(address),
  });

  const reputationQuery = useQuery({
    queryKey: ['reputation-score', address],
    queryFn: () => fetchReputationScore(address ?? ''),
    enabled: Boolean(address),
  });

  const openPositions = useMemo(() => {
    if (!positionsQuery.data) return [];
    return positionsQuery.data.filter((position) => position.status === 'open');
  }, [positionsQuery.data]);

  const projectedFees = useMemo(() => {
    return openPositions.reduce((total, position) => {
      const entryPrice = typeof position.entry_price_usd === 'number' ? position.entry_price_usd : 0;
      const sizeNop =
        typeof position.size_nop === 'number' ? position.size_nop : Number(position.size_nop ?? 0);
      return total + computeProtocolFee(entryPrice * sizeNop).protocolFeeUsd;
    }, 0);
  }, [openPositions]);

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
          <div className="mx-auto max-w-3xl space-y-4">
          <DashboardCard className="space-y-4 text-center">
            <DashboardSectionTitle label="Wallet" title="Connect your wallet" />
            <p className="text-sm-2 text-text-secondary">
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
      <div className="space-y-4">
      <DashboardCard className="space-y-4">
        <DashboardSectionTitle label="Wallet" title="Your NOP Intelligence wallet" />
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
      </DashboardCard>

      <DashboardCard className="space-y-4">
        <DashboardSectionTitle label="Actions" title="Boost your portfolio" />
        <ActionBar disabled={!connected} onSelect={handleActionSelect} />
      </DashboardCard>

      <DashboardCard className="space-y-4">
        <DashboardSectionTitle label="Holdings" title="Token allocations" />
        <div className="grid gap-4 md:grid-cols-2">
          {tokens.map((token) => (
            <TokenCard key={token.symbol} {...token} />
          ))}
        </div>
      </DashboardCard>

        <DashboardCard className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DashboardSectionTitle label="Protocol" title="Your social positions" />
            <span className="text-xs-2 font-semibold text-text-secondary">Projected fees {usd.format(projectedFees)}</span>
          </div>

          {positionsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-16 rounded-card border border-border-subtle bg-surface-muted" />
              ))}
            </div>
          ) : openPositions.length === 0 ? (
            <p className="text-sm-2 text-text-muted">No open positions yet. Register your next NOP trade to build on-chain reputation.</p>
          ) : (
            <div className="space-y-3">
              {openPositions.map((position) => {
                const entryPrice = typeof position.entry_price_usd === "number" ? position.entry_price_usd : null;
                const sizeNop =
                  typeof position.size_nop === "number" ? position.size_nop : Number(position.size_nop ?? 0);
                const fees = computeProtocolFee((entryPrice ?? 0) * sizeNop);
                const txHash = position.tx_hash_open ?? "";
                return (
                  <div key={position.id} className="rounded-[16px] border border-border-subtle bg-surface p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusPill tone={position.direction === "long" ? "success" : "danger"}>
                          {position.direction.toUpperCase()}
                        </StatusPill>
                        <span className="text-sm-2 font-semibold text-text-primary">
                          {sizeNop.toLocaleString(undefined, { maximumFractionDigits: 2 })} NOP
                        </span>
                      </div>
                      <span className="text-[11px] capitalize text-text-secondary">{position.status}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-3 text-[11px] text-text-secondary">
                      <div>
                        <p className="uppercase tracking-[0.2em] text-text-muted">Entry</p>
                        <p className="text-text-primary">{entryPrice ? usd.format(entryPrice) : "—"}</p>
                      </div>
                      <div>
                        <p className="uppercase tracking-[0.2em] text-text-muted">Tx</p>
                        <p className="text-text-primary">{txHash ? `${txHash.slice(0, 6)}…${txHash.slice(-4)}` : "—"}</p>
                      </div>
                      <div>
                        <p className="uppercase tracking-[0.2em] text-text-muted">Protocol fee</p>
                        <p className="text-text-primary">{usd.format(fees.protocolFeeUsd)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-card border border-border-subtle bg-surface-muted p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">Reputation summary</p>
            {reputationQuery.isLoading ? (
              <div className="mt-2 h-16 rounded-lg bg-white/60" />
            ) : reputationQuery.data ? (
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm-2 text-text-secondary">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Win rate</p>
                  <p className="text-base font-semibold text-text-primary">
                    {(reputationQuery.data.win_rate ?? 0).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Realized PnL</p>
                  <p className="text-base font-semibold text-text-primary">
                    {usd.format(reputationQuery.data.realized_pnl_usd ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Open trades</p>
                  <p className="text-base font-semibold text-text-primary">{reputationQuery.data.open_positions ?? 0}</p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm-2 text-text-muted">No reputation data yet.</p>
            )}
          </div>
        </DashboardCard>

        <DashboardCard className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DashboardSectionTitle label="History" title="Transactions" />
            <StatusPill tone="muted" className="text-[11px]">
              Updated {format(new Date(), "HH:mm")}
            </StatusPill>
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
