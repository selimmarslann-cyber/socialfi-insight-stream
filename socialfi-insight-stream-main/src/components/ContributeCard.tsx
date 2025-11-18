import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatUnits } from "ethers";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Contribute } from "@/lib/types";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { RegisterPositionDialog } from "@/components/protocol/RegisterPositionDialog";
import { StatusPill } from "@/components/ui/status-pill";
import { depositToContribute, withdrawFromContribute, getUserPosition } from "@/lib/pool";
import { openPosition } from "@/lib/pool";
import { useWalletStore } from "@/lib/store";

type ContributeCardProps = {
  item: Contribute;
};

const getStatusLabel = (poolEnabled?: boolean, contractPostId?: number | null) => {
  if (poolEnabled && contractPostId) {
    return { label: "Pool Open", tone: "success" as const };
  }
  if (poolEnabled) {
    return { label: "Coming Soon", tone: "warning" as const };
  }
  return { label: "Closed", tone: "muted" as const };
};

export const ContributeCard = ({ item }: ContributeCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState("100");
  const [txState, setTxState] = useState<null | "buy" | "sell">(null);
  const [positionWei, setPositionWei] = useState<bigint | null>(null);
  const [positionLoading, setPositionLoading] = useState(false);
  const { address, connected } = useWalletStore();
  const contractPostId = item.contractPostId ?? undefined;
  const poolActive = item.poolEnabled === true && item.contractPostId !== null;
  const status = getStatusLabel(item.poolEnabled, item.contractPostId);

  const refreshPosition = useCallback(async () => {
    if (!connected || !address || !contractPostId) {
      setPositionWei(null);
      setPositionLoading(false);
      return;
    }
    setPositionLoading(true);
    try {
      const value = await getUserPosition(address, contractPostId);
      setPositionWei(value);
    } catch (error) {
      console.error("Failed to load on-chain position", error);
    } finally {
      setPositionLoading(false);
    }
  }, [address, connected, contractPostId]);

  useEffect(() => {
    refreshPosition();
  }, [refreshPosition]);

  async function handleBuy() {
    try {
      await openPosition(1);
      alert("Position opened on-chain!");
    } catch (e) {
      console.error(e);
      alert("Error: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  const handleTransaction = async (mode: "buy" | "sell") => {
    const normalized = amount.trim();
    const numeric = Number(normalized);

    if (!normalized || !Number.isFinite(numeric) || numeric <= 0) {
      toast.error("Enter a valid positive NOP amount.");
      return;
    }

    if (!contractPostId) {
      toast.error("Pool is not configured for this contribute yet.");
      return;
    }

    setTxState(mode);
    try {
      if (mode === "buy") {
        await depositToContribute(contractPostId, normalized);
        toast.success("Your position was updated on-chain.");
      } else {
        await withdrawFromContribute(contractPostId, normalized);
        toast.success("Withdrawal submitted. Position updated.");
      }

      // Refresh the displayed position after the transaction settles.
      await refreshPosition();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed.";
      toast.error(message);
      console.error(error);
    } finally {
      setTxState(null);
    }
  };

  return (
    <>
        <DashboardCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg-2 font-semibold text-text-primary">{item.title}</h3>
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
        </div>
          <p className="text-sm-2 leading-relaxed text-text-secondary">
          NOP research pools coordinate contributions, pool rewards, and AI verifications. Each contribute aggregates
          signal strength, liquidity, and burn commitments before opening fully on-chain.
        </p>
          <div className="flex flex-wrap gap-2 text-xs-2 text-text-secondary">
            <StatusPill className="bg-surface-muted text-text-primary ring-0">Investors · 128</StatusPill>
            <StatusPill className="bg-surface-muted text-text-primary ring-0">TVL · $2.8M</StatusPill>
            <StatusPill className="bg-surface-muted text-text-primary ring-0">Risk · Moderate</StatusPill>
        </div>
        {poolActive ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to={`/pool/${item.contractPostId}/chart`}>Chart</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDialogOpen(true)}>
                Register manual trade
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">NOP amount</p>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Enter amount"
                className="max-w-xs"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="accent"
                size="sm"
                onClick={handleBuy}
                disabled={txState !== null}
              >
                {txState === "buy" ? "Processing…" : "Buy / Deposit"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTransaction("sell")}
                disabled={txState !== null}
              >
                {txState === "sell" ? "Processing…" : "Sell / Withdraw"}
              </Button>
            </div>
            <div className="text-xs-2 text-text-secondary">
              {connected && address ? (
                positionLoading ? (
                  "Fetching your on-chain position…"
                ) : positionWei !== null ? (
                  <>
                    Your on-chain position:{" "}
                    <span className="font-semibold text-text-primary">{formatUnits(positionWei, 18)} NOP</span>
                  </>
                ) : (
                  "On-chain position unavailable."
                )
              ) : (
                "Connect your wallet to trade and view on-chain positions."
              )}
            </div>
          </div>
        ) : (
            <p className="text-xs-2 text-text-muted">Pool access will unlock once governance verifies collateral.</p>
        )}
      </DashboardCard>

      <RegisterPositionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contributeId={item.id}
        contributeTitle={item.title}
        contractPostId={item.contractPostId ?? undefined}
      />
    </>
  );
};
