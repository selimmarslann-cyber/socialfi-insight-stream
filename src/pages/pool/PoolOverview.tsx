import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/Container";
import { usePoolAccess } from "@/hooks/usePoolAccess";
import { useWalletStore } from "@/lib/store";
import { getPreviewSell, getUserShares } from "@/lib/pool";
import { formatTokenAmount } from "@/lib/format";
import { applyMultiplier } from "@/lib/math";
import { CHAIN_ID, SELL_SLIPPAGE } from "@/lib/config";

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
    <Container>
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{contribute?.title ?? `Pool #${postId}`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(contributeLoading || postStateLoading) && <p className="muted">Yükleniyor...</p>}
            {!contributeLoading && !postStateLoading && (
              <>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Pool balance</span>
                  <span className="text-2xl font-semibold">{formatTokenAmount(postState?.reserve ?? 0n)} NOP</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="secondary">
                    <Link to={`/pool/${postId}/chart`}>Chart</Link>
                  </Button>
                  <Button asChild variant="default">
                    <Link to={`/pool/${postId}/buy`}>Buy</Link>
                  </Button>
                  {hasShares && (
                    <Button asChild disabled={sellDisabled}>
                      <Link to={`/pool/${postId}/sell`}>Sell</Link>
                    </Button>
                  )}
                </div>
                {hasShares && sellDisabled && (
                  <p className="muted">Rezerv yetersiz olduğu için satış geçici olarak kapalı.</p>
                )}
                {networkMismatch && (
                  <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
                    zkSync Era ağına geçiş yaparak pool işlemlerini gerçekleştirebilirsiniz (Chain ID: {CHAIN_ID}).
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};

export default PoolOverview;
