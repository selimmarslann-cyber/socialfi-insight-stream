import { useQuery } from '@tanstack/react-query';
import { Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/lib/store';

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
      className="h-9 gap-2 rounded-full border border-indigo-500/15 bg-white/80 px-4 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur transition hover:border-indigo-500/30 hover:bg-white"
      aria-label="NOP balance"
    >
      <Coins className="h-4 w-4 text-[#F5C76A]" />
      <span className="font-mono text-sm">
        {(data?.nop || nop).toLocaleString()}
      </span>
      <span className="hidden text-[11px] uppercase tracking-wide text-slate-400 md:inline">
        NOP
      </span>
    </Button>
  );
};
