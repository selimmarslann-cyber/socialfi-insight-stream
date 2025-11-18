import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { depositToContribute, withdrawFromContribute } from "@/lib/pool";

type TradeActionsProps = {
  contractPostId?: number | null;
  onSettled?: () => Promise<void> | void;
  className?: string;
};

export function TradeActions({ contractPostId, onSettled, className }: TradeActionsProps) {
  const [amount, setAmount] = useState("100");
  const [mode, setMode] = useState<"buy" | "sell" | null>(null);

  const handleTrade = async (nextMode: "buy" | "sell") => {
    if (mode !== null) return;

    try {
      setMode(nextMode);
      if (typeof window === "undefined") {
        throw new Error("Trading is only available in the browser.");
      }

      if (!window.ethereum) {
        toast.error("MetaMask not detected. Please install or enable MetaMask.");
        return;
      }

      if (!contractPostId && contractPostId !== 0) {
        toast.error("Pool is missing a valid contractPostId.");
        return;
      }

      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        toast.error("Enter a valid NOP amount.");
        return;
      }

      if (nextMode === "buy") {
        const tx = await depositToContribute(contractPostId, parsedAmount);
        toast.success("BUY order sent to Sepolia.", {
          description: tx?.hash ?? tx?.transactionHash ?? "Confirm in MetaMask to finalize.",
        });
      } else {
        const tx = await withdrawFromContribute(contractPostId, parsedAmount);
        toast.success("SELL order sent to Sepolia.", {
          description: tx?.hash ?? tx?.transactionHash ?? "Confirm in MetaMask to finalize.",
        });
      }

      await onSettled?.();
    } catch (error: unknown) {
      console.error("[TradeActions] trade failed", error);
      const message =
        error instanceof Error ? error.message : "Trade failed. Please try again.";
      toast.error(message);
    } finally {
      setMode(null);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur",
        "space-y-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Trade this pool</p>
          <p className="text-xs text-slate-500">
            Demo flow · NOPSocialPool · Sepolia test environment
          </p>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
          Active
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          step="1"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="h-10 w-28 rounded-xl text-sm"
        />
        <span className="text-xs font-semibold text-slate-500">NOP</span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="sm"
          className="flex-1 rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-500"
          disabled={mode !== null}
          onClick={() => handleTrade("buy")}
        >
          {mode === "buy" ? "Buying…" : "Buy"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
          disabled={mode !== null}
          onClick={() => handleTrade("sell")}
        >
          {mode === "sell" ? "Selling…" : "Sell"}
        </Button>
      </div>
    </div>
  );
}
