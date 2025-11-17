import { useQuery } from "@tanstack/react-query";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTrendingUsers } from "@/lib/mock-api";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";

interface TrendingUsersProps {
  limit?: number;
}

const trendIcon = (trend?: string) => {
  if (trend === "up") {
    return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
  }
  if (trend === "down") {
    return <TrendingDown className="h-3.5 w-3.5 text-rose-500" />;
  }
  return <Minus className="h-3.5 w-3.5 text-slate-400" />;
};

export const TrendingUsers = ({ limit = 5 }: TrendingUsersProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["trendingUsers"],
    queryFn: fetchTrendingUsers,
  });

  const displayUsers = data?.slice(0, limit) ?? [];

  return (
    <DashboardCard>
      <DashboardSectionTitle label="Social Intelligence" title="Trending Users" />
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: limit }).map((_, index) => (
              <div key={`trending-skeleton-${index}`} className="flex items-center justify-between gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-2/3 rounded-full" />
                  <Skeleton className="h-3 w-1/3 rounded-full" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))
          : displayUsers.map((user) => (
              <div
                key={user.username}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100/70 bg-slate-50/60 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-10 w-10 border border-slate-100 bg-white text-slate-600">
                    <AvatarFallback className="text-xs font-semibold">
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">@{user.username}</p>
                    <p className="text-xs text-slate-500">Ref {user.refCode}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-semibold text-slate-500">#{user.rank}</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                    {trendIcon(user.trend)}
                    {user.score.toLocaleString()} pts
                  </span>
                </div>
              </div>
            ))}

        {!isLoading && displayUsers.length === 0 ? (
          <p className="text-xs text-slate-500">No trending accounts yet.</p>
        ) : null}
      </div>
    </DashboardCard>
  );
};
