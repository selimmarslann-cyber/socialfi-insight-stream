import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/lib/store";

export const NopCounter = () => {
  const navigate = useNavigate();
  const { nop } = useWalletStore();

  const { data } = useQuery({
    queryKey: ["walletBalance"],
    queryFn: async () => {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { usdt: 1280.5, nop: 12840, last24h: 120 };
    },
    refetchInterval: 120000, // 2 minutes
  });

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => navigate("/wallet")}
      className="group h-10 gap-2 rounded-full border border-[color:var(--ring)] bg-[color:var(--bg-card)]/90 px-4 text-xs font-semibold text-[color:var(--text-secondary)] shadow-sm backdrop-blur transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
      aria-label="NOP balance"
    >
      <Coins className="h-4 w-4 text-[#F5C76A]" />
      <span className="font-mono text-sm text-[color:var(--text-primary)] transition group-hover:text-[color:var(--text-primary)]">
        {(data?.nop || nop).toLocaleString()}
      </span>
      <span className="hidden text-[11px] uppercase tracking-wide text-[color:var(--text-secondary)] md:inline">
        NOP
      </span>
    </Button>
  );
};
