import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Coins, TrendingUp, Download, History } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWalletStore } from '@/lib/store';
import { toast } from 'sonner';

export default function Wallet() {
  const { connected } = useWalletStore();
  const [isWithdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState('');

  const { data } = useQuery({
    queryKey: ['walletBalance'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        usdt: 1280.5,
        nop: 12840,
        last24h: 120,
        history: [
          { id: '1', type: 'earn', amount: 50, date: '2024-01-15', desc: 'Post upvoted' },
          { id: '2', type: 'earn', amount: 30, date: '2024-01-14', desc: 'Task completed' },
          { id: '3', type: 'withdraw', amount: -100, date: '2024-01-13', desc: 'Withdrawal' },
        ],
      };
    },
    enabled: connected,
  });

  const handleWithdraw = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    toast.success('Withdrawal request submitted');
    setWithdrawOpen(false);
    setAmount('');
  };

  if (!connected) {
    return (
      <Container>
        <div className="max-w-2xl mx-auto text-center py-16">
          <Coins className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to view your NOP balance and transaction history
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Connect Wallet
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Wallet</h1>
            <p className="text-muted-foreground">Manage your NOP points and earnings</p>
          </div>
          <Button onClick={() => setWithdrawOpen(true)} className="gap-2">
            <Download className="h-4 w-4" />
            Withdraw
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-accent/10 to-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                NOP Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold font-mono">{data?.nop.toLocaleString()}</span>
                <span className="text-lg text-muted-foreground">NOP</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last 24 Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <TrendingUp className="h-5 w-5 text-positive" />
                <span className="text-4xl font-bold font-mono text-positive">
                  +{data?.last24h}
                </span>
                <span className="text-lg text-muted-foreground">NOP</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.history.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-md border"
                >
                  <div>
                    <p className="font-medium">{tx.desc}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <Badge
                    variant={tx.type === 'earn' ? 'default' : 'secondary'}
                    className="font-mono"
                  >
                    {tx.amount > 0 ? '+' : ''}
                    {tx.amount} NOP
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isWithdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw NOP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available: {data?.nop.toLocaleString()} NOP
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setWithdrawOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleWithdraw} className="flex-1">
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
