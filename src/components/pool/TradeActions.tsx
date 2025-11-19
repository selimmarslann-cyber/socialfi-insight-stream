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
    try {
      setIsBuying(true);
      await buyShares(contractPostId, amount);
      toast.success("Buy transaction submitted.");
      await refreshPosition();
      await onSettled?.();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Buy failed";
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
    try {
      setIsSelling(true);
      await sellShares(contractPostId, amount);
      toast.success("Sell transaction submitted.");
      await refreshPosition();
      await onSettled?.();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Sell failed";
      toast.error(message);
    } finally {
      setIsSelling(false);
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-indigo-50/40 p-4 shadow-[0_10px_35px_-25px_rgba(79,70,229,0.85)] backdrop-blur-sm dark:border-slate-800/70 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-indigo-900/20",
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
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Trade this pool</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Demo flow · NOPSocialPool · Sepolia test environment
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-600 shadow-inner dark:bg-indigo-500/10 dark:text-indigo-200">
          Active
        </span>
      </div>

      <div className="flex items-center gap-3">
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
          className="h-10 flex-1 rounded-xl text-sm sm:flex-none sm:w-28"
          disabled={banned}
        />
        <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
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
          <p className="text-[11px] text-text-secondary">
            First time trading? Approve NOP once, then you can Buy and Sell instantly.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            size="sm"
            className="flex-1 rounded-xl bg-indigo-600 text-white shadow-indigo-500/30 hover:bg-indigo-500"
            disabled={banned || isBuying}
            onClick={handleBuy}
          >
            {isBuying ? "Buying…" : "Buy"}
          </Button>
          <Button
            size="sm"
            variant={hasPosition ? "outline" : "ghost"}
            className={cn(
              "flex-1 rounded-xl",
              hasPosition
                ? "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                : "text-slate-400 dark:text-slate-500",
            )}
            disabled={banned || isSelling || !hasPosition}
            onClick={hasPosition ? handleSell : undefined}
          >
            {isSelling ? "Selling…" : hasPosition ? "Sell" : "Sell (no position)"}
          </Button>
        </div>
      )}
    </div>
  );
}
