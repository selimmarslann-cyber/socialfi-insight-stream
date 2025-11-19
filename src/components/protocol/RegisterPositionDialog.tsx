import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useWalletStore } from "@/lib/store";
import { openSocialPosition } from "@/lib/protocol/positions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contributeId: string;
  contributeTitle: string;
  contractPostId?: number | null;
};

export function RegisterPositionDialog({
  open,
  onOpenChange,
  contributeId,
  contributeTitle,
  contractPostId,
}: Props) {
  const { address, chainId, connected } = useWalletStore();
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [size, setSize] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [txHash, setTxHash] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setDirection("long");
      setSize("");
      setEntryPrice("");
      setTxHash("");
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!connected || !address) {
      toast.error("Connect your wallet to register a position.");
      return;
    }

    const sizeValue = Number(size);
    if (!Number.isFinite(sizeValue) || sizeValue <= 0) {
      toast.error("Enter a valid NOP size.");
      return;
    }

    const trimmedHash = txHash.trim();
    if (!trimmedHash) {
      toast.error("Paste the transaction hash you executed on-chain.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await openSocialPosition({
        userAddress: address,
        contributeId,
        direction,
        sizeNop: sizeValue,
        entryPriceUsd: entryPrice ? Number(entryPrice) : undefined,
        txHashOpen: trimmedHash,
        chainId,
      });

      if (!response.ok) {
        throw new Error(response.error ?? "Failed to register position.");
      }

      toast.success("Position registered. Reputation will refresh shortly.");
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to register position.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Register NOP Position</DialogTitle>
          <DialogDescription>
            Link your on-chain trade with the {contributeTitle} contribute to unlock protocol reputation.
          </DialogDescription>
        </DialogHeader>

          <div className="space-y-4 text-sm text-text-secondary">
            <div className="rounded-xl border border-border-subtle bg-surface-muted p-3 text-[12px]">
              <p className="font-semibold text-text-primary">How it works</p>
              <ol className="mt-1 space-y-1">
              <li>1. Execute your NOP trade via your preferred wallet or DEX.</li>
              <li>2. Paste the resulting transaction hash to register the social position.</li>
            </ol>
            {contractPostId ? (
              <Link
                to={`/pool/${contractPostId}/buy`}
                  className="mt-2 inline-flex items-center text-[11px] font-semibold text-indigo-600 dark:text-indigo-300"
                onClick={() => onOpenChange(false)}
              >
                Go to pool dashboard →
              </Link>
            ) : null}
          </div>

          {!connected ? (
              <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
              Connect your wallet to register new positions.
            </p>
          ) : null}

          <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.2em] text-text-muted">Direction</Label>
            <RadioGroup value={direction} onValueChange={(value) => setDirection(value as "long" | "short")} className="grid grid-cols-2 gap-3">
              {(["long", "short"] as const).map((option) => (
                <label
                  key={option}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-semibold transition ${
                      direction === option ? "border-[var(--color-accent-start)] bg-[var(--color-accent-start)]/10 text-text-primary" : "border-border-subtle text-text-secondary"
                  }`}
                >
                  <RadioGroupItem value={option} />
                  {option.toUpperCase()}
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position-size">Size (NOP)</Label>
            <Input
              id="position-size"
              type="number"
              min="0"
              step="0.01"
              value={size}
              onChange={(event) => setSize(event.target.value)}
              placeholder="e.g. 15000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-price">Entry price (USD, optional)</Label>
            <Input
              id="entry-price"
              type="number"
              min="0"
              step="0.0001"
              value={entryPrice}
              onChange={(event) => setEntryPrice(event.target.value)}
              placeholder="e.g. 0.12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-hash">On-chain transaction hash</Label>
            <Input
              id="tx-hash"
              value={txHash}
              onChange={(event) => setTxHash(event.target.value)}
              placeholder="0x..."
            />
          </div>
        </div>

          <DialogFooter>
          <Button
            type="button"
            className="w-full"
            onClick={handleSubmit}
            disabled={!connected || isSubmitting}
          >
            {isSubmitting ? "Registering…" : "Register position"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
