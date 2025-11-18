import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ContributeCard } from "@/components/ContributeCard";
import {
  fetchContributesWithStats,
  type ContributeWithStats,
} from "@/lib/contributes";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import BoostedTasks from "@/components/BoostedTasks";
import TokenBurn from "@/components/TokenBurn";

const withDemoPoolFallback = (items: ContributeWithStats[]): ContributeWithStats[] => {
  if (items.length > 0) {
    return items;
  }

  return [
    {
      id: "demo-1",
      title: "Demo NOP Social Pool",
      subtitle: "Test the on-chain BUY / SELL flow instantly on Sepolia.",
      author: "@nop_demo",
      tags: ["demo", "onchain", "nop"],
      weeklyScore: 999,
      weeklyVolumeNop: 0,
      poolEnabled: true,
      contractPostId: 1,
      description:
        "This demo card is injected when the API has no pools so teams can verify the BUY / SELL integration without waiting for backend data.",
    },
  ];
};

const Contributes = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["contributes-with-stats"],
    queryFn: fetchContributesWithStats,
  });

  const contributes = useMemo(() => {
    if (Array.isArray(data)) {
      return withDemoPoolFallback(data);
    }
    if (isError) {
      return withDemoPoolFallback([]);
    }
    return [];
  }, [data, isError]);

  const showEmptyState = !isLoading && !isError && contributes.length === 0;
  const showCards = !isLoading && contributes.length > 0;

    return (
      <div className="space-y-4 lg:space-y-6">
        <DashboardCard className="space-y-3">
          <DashboardSectionTitle label="Pools" title="Contributes" />
          <p className="text-sm-2 leading-relaxed text-text-secondary">
            Follow the latest community pools, view on-chain BUY / SELL flows, and explore weekly popular positions.
          </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-text-muted">
              Ordered by 7-day NOP volume
            </p>
        </DashboardCard>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.1fr)] lg:gap-6">
          <div className="space-y-4">
            {isLoading ? (
              <DashboardCard>
                <p className="text-sm-2 text-text-muted">Loading pools…</p>
              </DashboardCard>
            ) : null}

            {isError ? (
              <DashboardCard>
                <p className="text-sm-2 text-destructive">
                  Could not load pools from the API. Showing the demo trading pool instead.
                </p>
              </DashboardCard>
            ) : null}

            {showEmptyState ? (
              <DashboardCard>
                <p className="text-sm-2 text-text-muted">Henüz aktif katkı bulunmuyor.</p>
              </DashboardCard>
            ) : null}

            {showCards ? (
              <div className="grid gap-4">
                {contributes.map((item) => (
                  <ContributeCard key={item.id} item={item} />
                ))}
              </div>
            ) : null}
          </div>

          <aside className="hidden space-y-4 lg:block">
            <BoostedTasks />
            <div className="hidden xl:block">
              <TokenBurn />
            </div>
          </aside>
        </div>
      </div>
    );
};

export default Contributes;
