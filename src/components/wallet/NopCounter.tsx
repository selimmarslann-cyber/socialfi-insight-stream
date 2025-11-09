import { useQuery } from '@tanstack/react-query';
import { Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export const NopCounter = () => {
  const navigate = useNavigate();
  const { nop } = useWalletStore();

  const { data } = useQuery({
    queryKey: ['walletBalance'],
    queryFn: async () => {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { usdt: 1280.5, nop: 12840, last24h: 120 };
    },
    refetchInterval: 120000, // 2 minutes
  });

  return (
    <Button
      variant="ghost"
      onClick={() => navigate('/wallet')}
      className="gap-2 hover:bg-accent/10"
      aria-label="NOP balance"
    >
      <Coins className="h-4 w-4 text-warning" />
      <span className="font-mono font-medium text-sm">
        {(data?.nop || nop).toLocaleString()}
      </span>
      <span className="text-xs text-muted-foreground hidden md:inline">NOP</span>
    </Button>
  );
};
