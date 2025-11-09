import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Coins,
  TrendingUp,
  History,
  Lock,
  Unlock,
  Download,
  Upload,
  LineChart,
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton';
import { useWalletStore } from '@/lib/store';
import { toast } from 'sonner';

type ChartRange = '7D' | '30D' | '1Y';

interface PnlPoint {
  label: string;
  value: number;
}

interface WalletHistoryItem {
  id: string;
  type: 'stake' | 'unstake' | 'earn' | 'deposit' | 'withdraw';
  amount: number;
  date: string;
  note: string;
}

interface WalletOverview {
  balance: {
    total: number;
    available: number;
    staked: number;
    rewards: number;
    apy: number;
  };
  pnl: Record<ChartRange, PnlPoint[]>;
  history: WalletHistoryItem[];
}

const providerLabels: Record<'metamask' | 'trust' | 'email', string> = {
  metamask: 'MetaMask',
  trust: 'Trust Wallet',
  email: 'Mail',
};

const fetchWalletOverview = async (): Promise<WalletOverview> => {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const today = new Date();
  const formatLabel = (date: Date) => format(date, 'd MMM');

  const generateSeries = (length: number, stepDays: number, base: number) =>
    Array.from({ length }, (_, index) => {
      const date = subDays(today, stepDays * (length - index - 1));
      const wave = Math.sin(index * 0.9) * 60;
      const trend = index * (base * 0.08);
      const value = Math.round(base + wave + trend);
      return { label: formatLabel(date), value };
    });

  const series7d = Array.from({ length: 7 }, (_, index) => {
    const date = subDays(today, 6 - index);
    const wave = Math.sin(index * 0.8) * 45;
    const trend = index * 18;
    return {
      label: formatLabel(date),
      value: Math.round(180 + wave + trend),
    };
  });

  const series30d = generateSeries(6, 5, 220);

  const series1y = Array.from({ length: 12 }, (_, index) => {
    const date = subMonths(today, 11 - index);
    const wave = Math.cos(index * 0.5) * 120;
    const trend = index * 95;
    return {
      label: format(date, 'MMM'),
      value: Math.round(400 + wave + trend),
    };
  });

  return {
    balance: {
      total: 12840,
      available: 6240,
      staked: 6600,
      rewards: 420,
      apy: 14.6,
    },
    pnl: {
      '7D': series7d,
      '30D': series30d,
      '1Y': series1y,
    },
    history: [
      {
        id: '1',
        type: 'stake',
        amount: 800,
        date: format(subDays(today, 2), 'yyyy-MM-dd'),
        note: 'Staked via MetaMask',
      },
      {
        id: '2',
        type: 'earn',
        amount: 120,
        date: format(subDays(today, 4), 'yyyy-MM-dd'),
        note: 'Daily task rewards',
      },
      {
        id: '3',
        type: 'deposit',
        amount: 1500,
        date: format(subDays(today, 6), 'yyyy-MM-dd'),
        note: 'Deposit from Trust Wallet',
      },
      {
        id: '4',
        type: 'unstake',
        amount: -400,
        date: format(subDays(today, 9), 'yyyy-MM-dd'),
        note: 'Unstaked to flexible balance',
      },
      {
        id: '5',
        type: 'withdraw',
        amount: -950,
        date: format(subDays(today, 12), 'yyyy-MM-dd'),
        note: 'Withdraw to exchange',
      },
    ],
  };
};

export default function Wallet() {
  const { connected, provider, refCode, inviterCode } = useWalletStore();
  const [selectedRange, setSelectedRange] = useState<ChartRange>('7D');
  const [activeAction, setActiveAction] = useState<
    'stake' | 'unstake' | 'deposit' | 'withdraw' | null
  >(null);
  const [actionAmount, setActionAmount] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['walletOverview'],
    queryFn: fetchWalletOverview,
    enabled: connected,
  });

  const providerLabel = provider ? providerLabels[provider] : undefined;
  const chartData = useMemo(() => data?.pnl[selectedRange] ?? [], [data, selectedRange]);

  const rangeStats = useMemo(() => {
    if (!chartData.length) {
      return { gain: 0, percent: 0 };
    }
    const start = chartData[0].value;
    const end = chartData[chartData.length - 1].value;
    const gain = end - start;
    const percent = start === 0 ? 0 : (gain / start) * 100;
    return { gain, percent };
  }, [chartData]);

  const actionConfig = {
    stake: {
      title: 'Stake NOP',
      description: 'Kilitle ve getiri kazanmaya başla.',
      icon: Lock,
      helper: `Kullanılabilir bakiye: ${data?.balance.available.toLocaleString() ?? 0} NOP`,
    },
    unstake: {
      title: 'Unstake',
      description: 'Kilitlemeyi sonlandır ve bakiyeni aç.',
      icon: Unlock,
      helper: `Kilitli bakiye: ${data?.balance.staked.toLocaleString() ?? 0} NOP`,
    },
    deposit: {
      title: 'Deposit',
      description: 'NOP bakiyeni platforma taşı.',
      icon: Download,
      helper: 'Cüzdanından NOP yatır.',
    },
    withdraw: {
      title: 'Withdraw',
      description: 'NOP bakiyeni dilediğin adrese çek.',
      icon: Upload,
      helper: 'Minimum çekim: 100 NOP',
    },
  } as const;

  const closeActionDialog = () => {
    setActiveAction(null);
    setActionAmount('');
  };

  const handleActionSubmit = () => {
    if (!activeAction) return;
    const value = Number(actionAmount);
    if (!value || value <= 0) {
      toast.error('Lütfen geçerli bir NOP miktarı girin.');
      return;
    }
    toast.success(
      `${value.toLocaleString()} NOP için ${actionConfig[activeAction].title} işlemi oluşturuldu.`
    );
    closeActionDialog();
  };

  if (!connected) {
    return (
      <Container>
        <div className="mx-auto max-w-2xl py-16 text-center">
          <Coins className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-bold">Cüzdanını bağla</h2>
          <p className="mb-6 text-muted-foreground">
            NOP bakiyeni, getirilerini ve hareketlerini görmek için cüzdanını bağla.
          </p>
          <div className="flex justify-center">
            <WalletConnectButton />
          </div>
        </div>
      </Container>
    );
  }

  if (isLoading || !data) {
    return (
      <Container>
        <div className="mx-auto max-w-5xl space-y-6 py-10">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, idx) => (
              <Skeleton key={idx} className="h-40 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Wallet</h1>
            <p className="text-muted-foreground">
              NOP varlıklarını yönet, stake et ve getirini takip et.
            </p>
            {inviterCode && (
              <p className="mt-1 text-xs text-muted-foreground">
                Referans kodun: <span className="font-mono uppercase">{inviterCode}</span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {providerLabel && <Badge variant="outline">{providerLabel}</Badge>}
            <Badge variant="secondary" className="font-mono uppercase">
              Ref {refCode}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-gradient-to-br from-accent/20 via-primary/10 to-background">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground tracking-wide">
                  Toplam NOP
                </p>
                <CardTitle className="text-4xl font-mono font-bold">
                  {data.balance.total.toLocaleString()}
                </CardTitle>
              </div>
              <LineChart className="h-10 w-10 text-accent" />
            </CardHeader>
            <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
              <div>
                <span className="text-xs uppercase">Staked</span>
                <p className="font-mono text-base text-foreground">
                  {data.balance.staked.toLocaleString()} NOP
                </p>
              </div>
              <div>
                <span className="text-xs uppercase">Available</span>
                <p className="font-mono text-base text-foreground">
                  {data.balance.available.toLocaleString()} NOP
                </p>
              </div>
              <div>
                <span className="text-xs uppercase">APY</span>
                <p className="font-mono text-base text-foreground">{data.balance.apy}%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Son 24 Saat Getiri</span>
                <TrendingUp className="h-5 w-5 text-positive" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-mono font-semibold text-positive">
                +{rangeStats.gain > 0 ? rangeStats.gain.toLocaleString() : 240} NOP
              </p>
              <p className="text-sm text-muted-foreground">
                Seçili periyotta toplam değişim:{' '}
                <span
                  className={`font-medium ${
                    rangeStats.percent >= 0 ? 'text-positive' : 'text-negative'
                  }`}
                >
                  {rangeStats.percent >= 0 ? '+' : ''}
                  {rangeStats.percent.toFixed(2)}%
                </span>
              </p>
              <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                Günlük ödül tahmini:{' '}
                <span className="font-semibold text-foreground">
                  {(data.balance.staked * 0.0008).toFixed(2)} NOP
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                NOP PnL grafiği
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                7 gün, 1 ay ve 1 yıllık getiri çizelgesi.
              </p>
            </div>
            <div className="flex gap-2">
              {(['7D', '30D', '1Y'] as ChartRange[]).map((range) => (
                <Button
                  key={range}
                  variant={selectedRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRange(range)}
                  className="font-semibold"
                >
                  {range === '7D' && '7 Gün'}
                  {range === '30D' && '1 Ay'}
                  {range === '1Y' && '1 Yıl'}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                pnl: {
                  label: 'NOP PnL',
                  color: 'hsl(var(--accent))',
                },
              }}
              className="h-72 w-full"
            >
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-pnl)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-pnl)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs text-muted-foreground"
                />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-pnl)"
                  strokeWidth={2}
                  fill="url(#pnlGradient)"
                  name="NOP PnL"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(actionConfig) as Array<keyof typeof actionConfig>).map((key) => {
            const meta = actionConfig[key];
            const Icon = meta.icon;
            return (
              <Card key={key}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">{meta.title}</h3>
                      <p className="text-xs text-muted-foreground">{meta.description}</p>
                    </div>
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <p className="text-xs text-muted-foreground">{meta.helper}</p>
                  <Button className="w-full" onClick={() => setActiveAction(key)}>
                    {meta.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-accent" />
              Son İşlemler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="uppercase">
                      {item.type}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">{item.note}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <span
                  className={`font-mono text-sm ${
                    item.amount >= 0 ? 'text-positive' : 'text-negative'
                  }`}
                >
                  {item.amount > 0 ? '+' : ''}
                  {item.amount.toLocaleString()} NOP
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(activeAction)} onOpenChange={(open) => (!open ? closeActionDialog() : null)}>
        {activeAction && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{actionConfig[activeAction].title}</DialogTitle>
              <DialogDescription>
                {actionConfig[activeAction].description} Lütfen NOP miktarını girin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="action-amount">Miktar (NOP)</Label>
                <Input
                  id="action-amount"
                  type="number"
                  placeholder="0.00"
                  value={actionAmount}
                  onChange={(event) => setActionAmount(event.target.value)}
                  className="font-mono"
                  min="0"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {actionConfig[activeAction].helper}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeActionDialog}>
                Vazgeç
              </Button>
              <Button onClick={handleActionSubmit}>{actionConfig[activeAction].title}</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </Container>
  );
}
