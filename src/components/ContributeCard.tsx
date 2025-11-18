import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { Contribute } from "@/lib/types";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { RegisterPositionDialog } from "@/components/protocol/RegisterPositionDialog";
import { StatusPill } from "@/components/ui/status-pill";

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
  const poolActive = item.poolEnabled === true && item.contractPostId !== null;
  const status = getStatusLabel(item.poolEnabled, item.contractPostId);

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
          <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
              <Link to={`/pool/${item.contractPostId}/chart`}>Chart</Link>
            </Button>
              <Button variant="accent" onClick={() => setDialogOpen(true)}>
              Buy & Register
            </Button>
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
