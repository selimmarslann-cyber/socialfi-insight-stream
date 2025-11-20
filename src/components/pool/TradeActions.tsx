import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { approveToken, buyShares, sellShares, getAllowance, getUserPosition } from "@/lib/pool";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { isProfileBanned } from "@/lib/profile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type TradeActionsProps = {
  contractPostId: number;
  onSettled?: () => Promise<void> | void;
  className?: string;
};

export function TradeActions({ contractPostId, onSettled, className }: TradeActionsProps) {
  const [amount, setAmount] = useState<number>(100);
  const [isApproving, setIsApproving] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [hasAllowance, setHasAllowance] = useState<boolean>(false);
  const [hasPosition, setHasPosition] = useState<boolean>(false);
  const { profile } = useCurrentProfile();
  const banned = isProfileBanned(profile);

  useEffect(() => {
    async function syncState() {
      try {
        if (typeof window === "undefined" || !(window as any).ethereum) return;

        const accounts = (await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        })) as string[];

        const account = accounts?.[0];
        if (!account) return;

        const allowance = await getAllowance(account);
        setHasAllowance(allowance > 0n);

        const position = await getUserPosition(contractPostId, account);
        setHasPosition((position?.shares ?? 0n) > 0n);
      } catch (err) {
        console.warn("TradeActions init error", err);
      }
    }

    void syncState();
  }, [contractPostId]);

  const blockIfBanned = () => {
    if (banned) {
      toast.error("Your account is restricted. Trading is disabled.");
      return true;
    }
    return false;
  };

  const handleApprove = async () => {
    if (blockIfBanned()) return;
    try {
      setIsApproving(true);
      await approveToken();
      setHasAllowance(true);
      toast.success("NOP approval granted for this pool.");
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Approval failed";
      toast.error(message);
    } finally {
      setIsApproving(false);
    }
  };

  const hasValidAmount = Number.isFinite(amount) && amount > 0;

  const refreshPosition = async () => {
    try {
      if (typeof window === "undefined" || !(window as any).ethereum) return;

      const accounts = (await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      const account = accounts?.[0];
      if (!account) {
        setHasPosition(false);
        return;
      }

      const pos = await getUserPosition(contractPostId, account);
      setHasPosition((pos?.shares ?? 0n) > 0n);
    } catch (err) {
      console.warn("TradeActions position refresh error", err);
    }
  };

  const handleBuy = async () => {
    if (blockIfBanned()) return;
    if (!hasValidAmount) {
      toast.error("Enter a valid NOP amount.");
      return;
    }
    if (typeof window === "undefined" || !(window as any).ethereum) {
      toast.error("Please install MetaMask or connect a wallet.");
      return;
    }
    try {
      setIsBuying(true);
      await buyShares(contractPostId, amount);
      toast.success("Buy transaction submitted successfully.");
      await refreshPosition();
      await onSettled?.();
    } catch (err: unknown) {
      console.error(err);
      let message = "Buy transaction failed.";
      if (err instanceof Error) {
        if (err.message.includes("user rejected") || err.message.includes("User denied")) {
          message = "Transaction cancelled by user.";
        } else if (err.message.includes("insufficient funds") || err.message.includes("balance")) {
          message = "Insufficient NOP balance or gas.";
        } else {
          message = err.message;
        }
      }
      toast.error(message);
    } finally {
      setIsBuying(false);
    }
  };

  const handleSell = async () => {
    if (blockIfBanned()) return;
    if (!hasValidAmount) {
      toast.error("Enter a valid NOP amount.");
      return;
    }
    if (!hasPosition) {
      toast.error("You don't have a position to sell.");
      return;
    }
    if (typeof window === "undefined" || !(window as any).ethereum) {
      toast.error("Please install MetaMask or connect a wallet.");
      return;
    }
    try {
      setIsSelling(true);
      await sellShares(contractPostId, amount);
      toast.success("Sell transaction submitted successfully.");
      await refreshPosition();
      await onSettled?.();
    } catch (err: unknown) {
      console.error(err);
      let message = "Sell transaction failed.";
      if (err instanceof Error) {
        if (err.message.includes("user rejected") || err.message.includes("User denied")) {
          message = "Transaction cancelled by user.";
        } else if (err.message.includes("insufficient funds") || err.message.includes("balance")) {
          message = "Insufficient balance or gas.";
        } else {
          message = err.message;
        }
      }
      toast.error(message);
    } finally {
      setIsSelling(false);
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card-soft",
        "sm:gap-4",
        className,
      )}
    >
      {banned ? (
        <Alert className="border-amber-200 bg-amber-50/60 text-amber-800">
          <AlertTitle>Trading disabled</AlertTitle>
          <AlertDescription>Your account has been restricted. Reach out to support to regain access.</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-text-primary">Trade this pool</p>
          <p className="text-xs text-text-secondary">
            NOPSocialPool · On-chain trading
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 shadow-inner dark:bg-emerald-500/10 dark:text-emerald-200">
          Active
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Input
          type="number"
          min={1}
          value={Number.isFinite(amount) ? amount : ""}
          onChange={(event) => {
            const nextValue = event.target.value;
            if (nextValue === "") {
              setAmount(Number.NaN);
              return;
            }
            setAmount(Number(nextValue));
          }}
          className="h-11 flex-1 rounded-xl text-base sm:h-10 sm:flex-none sm:w-28 sm:text-sm"
          disabled={banned}
        />
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          NOP
        </span>
      </div>

      {!hasAllowance ? (
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            className="w-full rounded-xl bg-indigo-600 text-white shadow-indigo-500/30 hover:bg-indigo-500"
            disabled={banned || isApproving}
            onClick={handleApprove}
          >
            {isApproving ? "Approving…" : "Approve NOP to trade"}
          </Button>
          <p className="text-[11px] text-text-muted">
            First time trading? Approve NOP once, then you can Buy and Sell instantly.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            size="sm"
            className="min-h-[44px] flex-1 rounded-xl bg-emerald-600 text-white shadow-emerald-500/30 hover:bg-emerald-500 disabled:opacity-50 touch-manipulation"
            disabled={banned || isBuying || !hasValidAmount}
            onClick={handleBuy}
          >
            {isBuying ? (
              <>
                <span className="mr-2">⏳</span> Buying…
              </>
            ) : (
              "Buy"
            )}
          </Button>
          <Button
            size="sm"
            variant={hasPosition ? "outline" : "ghost"}
            className={cn(
              "min-h-[44px] flex-1 rounded-xl touch-manipulation",
              hasPosition
                ? "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                : "text-text-muted opacity-50 cursor-not-allowed",
            )}
            disabled={banned || isSelling || !hasPosition || !hasValidAmount}
            onClick={hasPosition ? handleSell : () => {
              toast.info("You don't have a position to sell");
            }}
          >
            {isSelling ? (
              <>
                <span className="mr-2">⏳</span> Selling…
              </>
            ) : hasPosition ? (
              "Sell"
            ) : (
              "Sell (no position)"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
