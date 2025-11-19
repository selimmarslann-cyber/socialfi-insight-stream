import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { usePoolAccess } from "@/hooks/usePoolAccess";
import { useWalletStore } from "@/lib/store";
import { getPreviewSell, getUserShares } from "@/lib/pool";
import { formatTokenAmount } from "@/lib/format";
import { applyMultiplier } from "@/lib/math";
import { CHAIN_ID, SELL_SLIPPAGE } from "@/lib/config";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { LiquidityDepthChart } from "@/components/pool/LiquidityDepthChart";

const PoolOverview = () => {
  const { postId } = useParams<{ postId: string }>();
  const { contribute, postState, contributeLoading, postStateLoading } = usePoolAccess(postId);
  const { connected, address, chainId } = useWalletStore();

  const userSharesQuery = useQuery({
    queryKey: ["pool-user-shares", postId, address],
    queryFn: async () => {
      if (!postId || !address) return 0n;
      return getUserShares(address, postId);
    },
    enabled: Boolean(postId && address),
  });

  const sellPreviewQuery = useQuery({
    queryKey: ["pool-sell-preview", postId, address, userSharesQuery.data?.toString()],
    queryFn: async () => {
      if (!postId) return { gross: 0n, fee: 0n, net: 0n };
      if (!userSharesQuery.data || userSharesQuery.data === 0n) {
        return { gross: 0n, fee: 0n, net: 0n };
      }
      return getPreviewSell(postId, userSharesQuery.data);
    },
    enabled: Boolean(postId && userSharesQuery.data && userSharesQuery.data > 0n),
  });

  const hasShares = userSharesQuery.data !== undefined && userSharesQuery.data > 0n;
  const netWithSlippage = useMemo(() => {
    if (!sellPreviewQuery.data) return 0n;
    return applyMultiplier(sellPreviewQuery.data.net, SELL_SLIPPAGE);
  }, [sellPreviewQuery.data]);

  const sellDisabled = !sellPreviewQuery.data || !postState || postState.reserve < netWithSlippage;
  const networkMismatch = connected && chainId !== CHAIN_ID;

    return (
        <div className="mx-auto max-w-4xl space-y-4 sm:space-y-5">
          <DashboardCard className="space-y-4">
            <DashboardSectionTitle label="Pool" title={contribute?.title ?? `Pool #${postId}`} />
            {(contributeLoading || postStateLoading) && <p className="text-sm text-text-secondary">Yükleniyor...</p>}
          {!contributeLoading && !postStateLoading ? (
            <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-border-subtle bg-surface-muted px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Pool balance</p>
                    <p className="text-2xl font-semibold text-text-primary">{formatTokenAmount(postState?.reserve ?? 0n)} NOP</p>
                  </div>
                  {postState && postState.reserve > 0n && (
                    <LiquidityDepthChart
                      reserve={postState.reserve}
                      supply={0n} // TODO: Get actual supply from contract
                    />
                  )}
                </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                <Button 
                  asChild 
                  variant="outline" 
                  className="min-h-[44px] w-full rounded-full touch-manipulation sm:w-auto"
                >
                  <Link to={`/pool/${postId}/chart`}>Chart</Link>
                </Button>
                <Button 
                  asChild 
                  className="min-h-[44px] w-full rounded-full touch-manipulation sm:w-auto"
                >
                  <Link to={`/pool/${postId}/buy`}>Buy</Link>
                </Button>
                {hasShares && (
                  <Button 
                    asChild 
                    disabled={sellDisabled} 
                    className="min-h-[44px] w-full rounded-full touch-manipulation sm:w-auto"
                  >
                    <Link to={`/pool/${postId}/sell`}>Sell</Link>
                  </Button>
                )}
              </div>
                {hasShares && sellDisabled ? (
                  <p className="text-xs text-warning">Rezerv yetersiz olduğu için satış geçici olarak kapalı.</p>
              ) : null}
              {networkMismatch ? (
                  <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                  zkSync Era ağına geçiş yaparak pool işlemlerini gerçekleştirebilirsiniz (Chain ID: {CHAIN_ID}).
                </div>
              ) : null}
            </>
          ) : null}
        </DashboardCard>
      </div>
    );
};

export default PoolOverview;
