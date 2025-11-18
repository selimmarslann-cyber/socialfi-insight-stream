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
        className="group h-10 gap-2 rounded-full border border-border-subtle bg-card px-4 text-xs font-semibold text-muted-foreground shadow-subtle transition hover:bg-surface focus-visible:ring-2 focus-visible:ring-indigo-200"
        aria-label="NOP balance"
      >
        <Coins className="h-4 w-4 text-amber-500" />
        <span className="font-mono text-sm text-foreground transition group-hover:text-foreground">
          {(data?.nop || nop).toLocaleString()}
        </span>
        <span className="hidden text-[11px] uppercase tracking-wide text-muted-foreground md:inline">
          NOP
        </span>
      </Button>
    );
};
