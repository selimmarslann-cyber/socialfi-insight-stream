import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabaseClient";
import { formatDistanceToNow } from "date-fns";
import { fetchUserSocialPositions } from "@/lib/protocol/positions";

type TopPositionsProps = {
  walletAddress: string;
  limit?: number;
};

export function TopPositions({ walletAddress, limit = 5 }: TopPositionsProps) {
  const positionsQuery = useQuery({
    queryKey: ["top-positions", walletAddress, limit],
    queryFn: async () => {
      const positions = await fetchUserSocialPositions(walletAddress);
      return positions.slice(0, limit);
    },
    enabled: Boolean(walletAddress),
  });

  const positions = positionsQuery.data ?? [];

  if (positionsQuery.isLoading) {
    return (
      <Card className="rounded-3xl border border-border bg-card p-6 shadow-card-soft">
        <Skeleton className="h-32 w-full rounded-2xl" />
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card className="rounded-3xl border border-border bg-card p-6 shadow-card-soft">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Top Positions</p>
          <p className="text-sm text-text-secondary">
            No on-chain positions yet. Start investing from the Explore or Contributes section to build your Alpha.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-border bg-card p-6 shadow-card-soft">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Top Positions</p>
        <div className="space-y-2">
          {positions.map((position) => {
            const isOpen = position.status === "open";
            const pnl = position.realized_pnl_usd;
            const sizeNop = typeof position.size_nop === "number" ? position.size_nop : Number(position.size_nop ?? 0);
            const formattedAmount = new Intl.NumberFormat(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            }).format(sizeNop);

            const pnlPercent = position.entry_price_usd && position.exit_price_usd
              ? ((position.exit_price_usd - position.entry_price_usd) / position.entry_price_usd) * 100
              : null;

            return (
              <div
                key={position.id}
                className="flex items-center justify-between rounded-2xl border border-border-subtle bg-card/70 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={position.direction === "long" ? "default" : "secondary"}
                    className="rounded-full"
                  >
                    {position.direction.toUpperCase()}
                  </Badge>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {formattedAmount} NOP
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatDistanceToNow(new Date(position.opened_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {isOpen ? (
                    <Badge variant="outline" className="rounded-full">
                      Open
                    </Badge>
                  ) : pnlPercent !== null ? (
                    <p
                      className={`text-sm font-semibold ${
                        pnlPercent > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {pnlPercent > 0 ? "+" : ""}
                      {pnlPercent.toFixed(1)}%
                    </p>
                  ) : pnl !== null ? (
                    <p
                      className={`text-xs font-semibold ${
                        pnl > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {pnl > 0 ? "+" : ""}${pnl.toFixed(2)}
                    </p>
                  ) : (
                    <p className="text-xs text-text-secondary">Closed</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

