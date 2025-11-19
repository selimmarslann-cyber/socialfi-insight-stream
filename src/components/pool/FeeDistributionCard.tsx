import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateFairFeeDistribution, getFeeDistributionSummary } from "@/lib/fairFeeDistribution";
import { formatTokenAmount } from "@/lib/format";
import { Users, Coins, Building2, Sparkles } from "lucide-react";

type FeeDistributionCardProps = {
  amount: bigint;
  isBuy: boolean;
  buyerCount?: number;
};

export function FeeDistributionCard({ amount, isBuy, buyerCount = 0 }: FeeDistributionCardProps) {
  const breakdown = useMemo(() => {
    return calculateFairFeeDistribution(amount, isBuy, buyerCount);
  }, [amount, isBuy, buyerCount]);

  const summary = useMemo(() => {
    return getFeeDistributionSummary(breakdown);
  }, [breakdown]);

  return (
    <Card className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Fair Fee Distribution</h3>
        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-cyan-950/40 dark:text-cyan-300">
          Total: {formatTokenAmount(breakdown.totalFee)} NOP
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Creator Share */}
        <div className="flex items-center justify-between rounded-xl bg-emerald-50/60 p-3 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/40">
              <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{summary.creator.label}</p>
              <p className="text-xs text-text-secondary">{summary.creator.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-text-primary">
              {formatTokenAmount(summary.creator.amount)}
            </p>
            <p className="text-xs text-text-muted">{summary.creator.percent}%</p>
          </div>
        </div>

        {/* Liquidity Provider Share */}
        <div className="flex items-center justify-between rounded-xl bg-blue-50/60 p-3 dark:bg-blue-950/20">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/40">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{summary.liquidity.label}</p>
              <p className="text-xs text-text-secondary">{summary.liquidity.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-text-primary">
              {formatTokenAmount(summary.liquidity.amount)}
            </p>
            <p className="text-xs text-text-muted">{summary.liquidity.percent}%</p>
          </div>
        </div>

        {/* Treasury Share */}
        <div className="flex items-center justify-between rounded-xl bg-purple-50/60 p-3 dark:bg-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/40">
              <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{summary.treasury.label}</p>
              <p className="text-xs text-text-secondary">{summary.treasury.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-text-primary">
              {formatTokenAmount(summary.treasury.amount)}
            </p>
            <p className="text-xs text-text-muted">{summary.treasury.percent}%</p>
          </div>
        </div>

        {/* Early Buyer Bonus */}
        {summary.earlyBonus && (
          <div className="flex items-center justify-between rounded-xl bg-amber-50/60 p-3 dark:bg-amber-950/20">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/40">
                <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{summary.earlyBonus.label}</p>
                <p className="text-xs text-text-secondary">{summary.earlyBonus.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-text-primary">
                {formatTokenAmount(summary.earlyBonus.amount)}
              </p>
              <p className="text-xs text-text-muted">{summary.earlyBonus.percent}%</p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface-muted/50 p-3">
        <p className="text-xs text-text-secondary">
          <span className="font-semibold text-text-primary">Net Amount:</span>{" "}
          {formatTokenAmount(breakdown.netAmount)} NOP (after {formatTokenAmount(breakdown.totalFee)} NOP fee)
        </p>
      </div>
    </Card>
  );
}

