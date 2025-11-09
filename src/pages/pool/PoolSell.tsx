import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/layout/Container";
import { usePoolAccess } from "@/hooks/usePoolAccess";
import { useWalletStore } from "@/lib/store";
import { getPreviewSell, getUserShares } from "@/lib/pool";
import { applyMultiplier } from "@/lib/math";
import { formatTokenAmount } from "@/lib/format";
import { CHAIN_ID, SELL_FEE_BPS_UI, SELL_SLIPPAGE } from "@/lib/config";

const PoolSell = () => {
  const { postId } = useParams<{ postId: string }>();
  const { contribute, postState, contributeLoading, postStateLoading } = usePoolAccess(postId);
  const { connected, chainId, address } = useWalletStore();
  const [sharesInput, setSharesInput] = useState("");

  const userSharesQuery = useQuery({
    queryKey: ["pool-user-shares", postId, address],
    queryFn: async () => {
      if (!postId || !address) return 0n;
      return getUserShares(address, postId);
    },
    enabled: Boolean(postId && address),
  });

  const sharesAmount = useMemo(() => {
    const sanitized = sharesInput.trim() === "" ? "0" : sharesInput;
    return BigInt(sanitized);
  }, [sharesInput]);

  const previewQuery = useQuery({
    queryKey: ["pool-sell-preview", postId, sharesAmount.toString()],
    queryFn: async () => {
      if (!postId) return { gross: 0n, fee: 0n, net: 0n };
      return getPreviewSell(postId, sharesAmount);
    },
    enabled: Boolean(postId) && sharesAmount > 0n,
  });

  const preview = previewQuery.data ?? { gross: 0n, fee: 0n, net: 0n };
  const minNet = applyMultiplier(preview.net, SELL_SLIPPAGE);
  const reserveInsufficient = Boolean(postState && postState.reserve < preview.net && preview.net > 0n);
  const networkMismatch = connected && chainId !== CHAIN_ID;
  const userShares = userSharesQuery.data ?? 0n;
  const exceedingBalance = sharesAmount > userShares;
  const sellDisabled =
    !connected ||
    networkMismatch ||
    sharesAmount === 0n ||
    exceedingBalance ||
    reserveInsufficient ||
    contribute?.poolEnabled !== true ||
    postState?.active !== true;

  const handleInputChange = (value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      setSharesInput(value);
    } else {
      toast.error("Sadece tam sayı pay girebilirsiniz.");
    }
  };

  return (
    <Container>
      <div className="max-w-3xl mx-auto space-y-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{contribute?.title ?? `Pool #${postId}`} - Sell</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {(contributeLoading || postStateLoading) && <p className="muted">Yükleniyor...</p>}
            {!contributeLoading && !postStateLoading && (
              <>
                <div className="rounded-md border border-border p-4 space-y-1">
                  <span className="text-sm text-muted-foreground">Toplam payınız</span>
                  <span className="text-2xl font-semibold">{userShares.toString()}</span>
                </div>

                {networkMismatch && (
                  <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
                    zkSync Era ağına bağlanarak işlemi gerçekleştirebilirsiniz (Chain ID: {CHAIN_ID}).
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="shares" className="text-sm font-medium">
                    Satılacak pay
                  </label>
                  <Input
                    id="shares"
                    type="number"
                    min={0}
                    step={1}
                    value={sharesInput}
                    onChange={(event) => handleInputChange(event.target.value)}
                    placeholder="0"
                  />
                  {exceedingBalance && <p className="muted">Pay miktarı bakiyenizi aşamaz.</p>}
                </div>

                <div className="space-y-2 rounded-md border border-dashed border-border p-4 text-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Preview</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Brüt</span>
                      <span>{formatTokenAmount(preview.gross)} NOP</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Fee (%{SELL_FEE_BPS_UI / 100})</span>
                      <span>{formatTokenAmount(preview.fee)} NOP</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Net</span>
                      <span>{formatTokenAmount(preview.net)} NOP</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Min (slippage {Math.round((1 - SELL_SLIPPAGE) * 100)}%)</span>
                      <span>{formatTokenAmount(minNet)} NOP</span>
                    </div>
                  </div>
                </div>

                {reserveInsufficient && <p className="muted">Rezerv yetersiz.</p>}

                <div className="rounded-md bg-muted/40 p-4 text-sm space-y-2">
                  <p className="font-semibold">Ekonomi Notu</p>
                  <p>Net = gross × (1 - {SELL_FEE_BPS_UI} / 10,000).</p>
                  <p>Kâr hesaplaması: realized = netSell - maliyet; unrealized = netNow - maliyet (hodl).</p>
                </div>

                <Button disabled={sellDisabled}>Sell</Button>

                <p className="muted">satış işlemleri geri alınamaz.</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};

export default PoolSell;
