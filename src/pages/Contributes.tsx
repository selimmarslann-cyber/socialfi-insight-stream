import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ContributeCard } from "@/components/ContributeCard";
import {
  fetchContributesWithStats,
  fetchWeeklyTrendingContributes,
  type ContributeWithStats,
} from "@/lib/contributes";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import BoostedTasks from "@/components/BoostedTasks";
import TokenBurn from "@/components/TokenBurn";
import { CreateContributeDialog } from "@/components/contribute/CreateContributeDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState, Skeleton } from "@/components/ui/LoadingState";
import { Sparkles } from "lucide-react";

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

  const { data: weeklyTrending, isLoading: isLoadingTrending } = useQuery({
    queryKey: ["contributes-weekly-trending"],
    queryFn: fetchWeeklyTrendingContributes,
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

  const trending = useMemo(() => {
    if (Array.isArray(weeklyTrending)) {
      return weeklyTrending.slice(0, 5); // Top 5 weekly trending
    }
    return [];
  }, [weeklyTrending]);

  const showEmptyState = !isLoading && !isError && contributes.length === 0;
  const showCards = !isLoading && contributes.length > 0;

    return (
      <div className="space-y-4 lg:space-y-6">
        <DashboardCard className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-2 sm:space-y-3">
              <DashboardSectionTitle label="Pools" title="Contributes" />
              <p className="text-sm leading-relaxed text-text-secondary sm:text-sm-2">
                Follow the latest community pools, view on-chain BUY / SELL flows, and explore weekly popular positions.
              </p>
            </div>
            <div data-create-contribute className="flex-shrink-0">
              <CreateContributeDialog />
            </div>
          </div>
        </DashboardCard>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.1fr)] lg:gap-6">
          <div className="space-y-4">
            {trending.length > 0 && !isLoadingTrending ? (
              <DashboardCard className="space-y-3">
                <DashboardSectionTitle label="Trending" title="This week's top contributes" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-text-muted">
                  Popular pools from the last 7 days
                </p>
                <div className="grid gap-4">
                  {trending.map((item) => (
                    <ContributeCard key={`trending-${item.id}`} item={item} />
                  ))}
                </div>
              </DashboardCard>
            ) : null}

            <DashboardCard className="space-y-3">
              <DashboardSectionTitle label="All" title="All contributes" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-text-muted">
                Ordered by 7-day NOP volume
              </p>
            </DashboardCard>

            {isLoading ? (
              <DashboardCard className="animate-fade-in">
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ))}
                </div>
              </DashboardCard>
            ) : null}

            {isError ? (
              <DashboardCard className="animate-fade-in">
                <EmptyState
                  icon="⚠️"
                  title="Failed to load contributes"
                  description="Could not load pools from the API. Please try again later."
                />
              </DashboardCard>
            ) : null}

            {showEmptyState ? (
              <DashboardCard className="animate-fade-in">
                <EmptyState
                  icon={<Sparkles className="h-8 w-8 text-indigo-500" />}
                  title="No contributes yet"
                  description="Be the first to create a contribute and share your trading idea with the community."
                  action={{
                    label: "Create Contribute",
                    onClick: () => {
                      // Trigger create dialog
                      const button = document.querySelector('[data-create-contribute]') as HTMLButtonElement;
                      button?.click();
                    },
                  }}
                />
              </DashboardCard>
            ) : null}

            {showCards ? (
              <div className="grid gap-4 animate-fade-in">
                {contributes.map((item, index) => (
                  <div key={item.id} className="stagger-item">
                    <ContributeCard item={item} />
                  </div>
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
