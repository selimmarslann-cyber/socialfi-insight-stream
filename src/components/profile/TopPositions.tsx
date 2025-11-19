import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabaseClient";
import { formatDistanceToNow } from "date-fns";

type TopPositionsProps = {
  walletAddress: string;
  limit?: number;
};

type PositionRow = {
  id: string;
  side: string;
  amount: number;
  opened_at: string;
  closed_at: string | null;
  roi: number | null;
  tx_hash: string | null;
};

export function TopPositions({ walletAddress, limit = 5 }: TopPositionsProps) {
  const positionsQuery = useQuery({
    queryKey: ["top-positions", walletAddress, limit],
    queryFn: async () => {
      const client = supabase;
      if (!client) return [];

      const { data, error } = await client
        .from("onchain_positions")
        .select("id, side, amount, opened_at, closed_at, roi, tx_hash")
        .eq("wallet_address", walletAddress.toLowerCase())
        .order("opened_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.warn("[TopPositions] Failed to fetch positions", error);
        return [];
      }

      return (data ?? []) as PositionRow[];
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
            const isOpen = position.closed_at === null;
            const roi = position.roi;
            const formattedAmount = new Intl.NumberFormat(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            }).format(position.amount);

            return (
              <div
                key={position.id}
                className="flex items-center justify-between rounded-2xl border border-border-subtle bg-card/70 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={position.side === "BUY" ? "default" : "secondary"}
                    className="rounded-full"
                  >
                    {position.side}
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
                  ) : roi !== null ? (
                    <p
                      className={`text-sm font-semibold ${
                        roi > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {roi > 0 ? "+" : ""}
                      {roi.toFixed(1)}%
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

