/**
 * Badge List Component
 * Displays a grid of user badges
 */

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCard } from "./BadgeCard";
import { getUserBadges, type UserBadge } from "@/lib/badges";
import { useWalletStore } from "@/lib/store";
import { EmptyState } from "@/components/ui/EmptyState";
import { Award } from "lucide-react";

type BadgeListProps = {
  walletAddress?: string;
  className?: string;
};

export function BadgeList({ walletAddress, className }: BadgeListProps) {
  const { address } = useWalletStore();
  const targetAddress = walletAddress || address;

  const { data: badges, isLoading } = useQuery({
    queryKey: ["user-badges", targetAddress],
    queryFn: () => (targetAddress ? getUserBadges(targetAddress) : Promise.resolve([])),
    enabled: !!targetAddress,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!badges || badges.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title="No badges yet"
        description="Complete actions to earn badges and showcase your achievements."
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {badges.map((userBadge) => (
          <BadgeCard
            key={userBadge.id}
            badge={userBadge.badge!}
            earnedAt={userBadge.earnedAt}
            size="md"
          />
        ))}
      </div>
    </div>
  );
}

