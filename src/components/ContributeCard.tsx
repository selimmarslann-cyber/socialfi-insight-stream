import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { Contribute } from "@/lib/types";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";

type ContributeCardProps = {
  item: Contribute;
};

const getStatusLabel = (poolEnabled?: boolean, contractPostId?: number | null) => {
  if (poolEnabled && contractPostId) {
    return { label: "Pool Open", tone: "text-emerald-600 bg-emerald-50 border-emerald-100" };
  }
  if (poolEnabled) {
    return { label: "Coming Soon", tone: "text-amber-600 bg-amber-50 border-amber-100" };
  }
  return { label: "Closed", tone: "text-slate-500 bg-slate-100 border-slate-200" };
};

export const ContributeCard = ({ item }: ContributeCardProps) => {
  const poolActive = item.poolEnabled === true && item.contractPostId !== null;
  const status = getStatusLabel(item.poolEnabled, item.contractPostId);

  return (
    <DashboardCard className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.tone}`}>{status.label}</span>
      </div>
      <p className="text-sm text-slate-500">
        NOP research pools coordinate contributions, pool rewards, and AI verifications. Each contribute aggregates
        signal strength, liquidity, and burn commitments before opening fully on-chain.
      </p>
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Investors · 128</span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">TVL · $2.8M</span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Risk · Moderate</span>
      </div>
      {poolActive ? (
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link to={`/pool/${item.contractPostId}/chart`}>Chart</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link to={`/pool/${item.contractPostId}/buy`}>Buy</Link>
          </Button>
        </div>
      ) : (
        <p className="text-xs text-slate-400">Pool access will unlock once governance verifies collateral.</p>
      )}
    </DashboardCard>
  );
};
