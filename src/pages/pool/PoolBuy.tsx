import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/layout/Container";
import { usePoolAccess } from "@/hooks/usePoolAccess";
import { useWalletStore } from "@/lib/store";
import { getPreviewBuyCost } from "@/lib/pool";
import { applyBps, applyMultiplier } from "@/lib/math";
import { formatTokenAmount } from "@/lib/format";
import {
  BUY_SLIPPAGE,
  CHAIN_ID,
  CREATOR_BPS_UI,
  MIN_BUY_NOP,
} from "@/lib/config";
import { postPoolBuy } from "@/backend/pool";
import { logInvestmentBuy } from "@/lib/orders";

const MIN_BUY_VALUE = Number(MIN_BUY_NOP);
const MIN_BUY_TEXT = MIN_BUY_VALUE.toLocaleString();

const PoolBuy = () => {
  const { postId } = useParams<{ postId: string }>();
  const {
    contribute,
    postState,
    contributeLoading,
    postStateLoading,
    refetchPostState,
  } = usePoolAccess(postId);
  const { connected, chainId } = useWalletStore();
  const [sharesInput, setSharesInput] = useState("");

  const sharesAmount = useMemo(() => {
    const sanitized = sharesInput.trim() === "" ? "0" : sharesInput;
    return BigInt(sanitized);
  }, [sharesInput]);

  const previewQuery = useQuery({
    queryKey: ["pool-buy-preview", postId, sharesAmount.toString()],
    queryFn: async () => {
      if (!postId) return 0n;
      return getPreviewBuyCost(postId, sharesAmount);
    },
    enabled: Boolean(postId) && sharesAmount > 0n,
  });

  const cost = previewQuery.data ?? 0n;
  const maxCost = applyMultiplier(cost, BUY_SLIPPAGE);
  const creatorShare = applyBps(cost, CREATOR_BPS_UI);
  const reserveShare = cost - creatorShare;
  const networkMismatch = connected && chainId !== CHAIN_ID;
  const buyDisabled =
    !connected ||
    networkMismatch ||
    sharesAmount === 0n ||
    cost < MIN_BUY_NOP ||
    contribute?.poolEnabled !== true ||
    postState?.active !== true;

  const showMinWarning = cost > 0n && cost < MIN_BUY_NOP;
  const postIdNumeric = postId ? Number.parseInt(postId, 10) : NaN;

  const buyMutation = useMutation({
    mutationFn: async () => {
      if (!postId) throw new Error("Eksik post bilgisi");
      if (sharesAmount <= 0n) throw new Error("Geçersiz pay miktarı");
      const payload = {
        shares: sharesAmount.toString(),
        maxCost: maxCost.toString(),
      };
      const response = await postPoolBuy(postId, payload);
      const txHash =
        typeof response?.data === "object" && response.data
          ? (response.data as { txHash?: string }).txHash
          : undefined;

      if (!Number.isFinite(postIdNumeric)) {
        console.warn("Investment log skipped: geçersiz postId");
      } else {
        const amountValue = Number(cost);
        if (Number.isFinite(amountValue) && amountValue > 0) {
          try {
            await logInvestmentBuy(postIdNumeric, amountValue, txHash);
          } catch (error) {
            console.warn("Investment log failed", error);
          }
        }
      }

      return response;
    },
    onSuccess: () => {
      toast.success("Buy işlemi gönderildi");
      refetchPostState();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "İşlem başarısız, lütfen tekrar deneyin";
      toast.error(message);
    },
  });

  return (
    <Container>
      <div className="max-w-3xl mx-auto space-y-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{contribute?.title ?? `Pool #${postId}`} - Buy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {(contributeLoading || postStateLoading) && <p className="muted">Yükleniyor...</p>}
            {!contributeLoading && !postStateLoading && (
              <>
                <div className="rounded-md border border-border p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Pool balance</span>
                    <span className="text-2xl font-semibold">{formatTokenAmount(postState?.reserve ?? 0n)} NOP</span>
                  </div>
                </div>

                {networkMismatch && (
                  <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
                    zkSync Era ağına bağlanarak işlemi gerçekleştirebilirsiniz (Chain ID: {CHAIN_ID}).
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="shares" className="text-sm font-medium">
                    Pay miktarı
                  </label>
                  <Input
                    id="shares"
                    type="number"
                    min={0}
                    step={1}
                    value={sharesInput}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === "" || /^\d+$/.test(value)) {
                        setSharesInput(value);
                      } else {
                        toast.error("Sadece tam sayı pay girebilirsiniz.");
                      }
                    }}
                    placeholder="0"
                  />
                </div>

                  <div className="space-y-2 rounded-md border border-dashed border-border p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Preview</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Maliyet</span>
                        <span>{formatTokenAmount(cost)} NOP</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Creator payı</span>
                        <span>{formatTokenAmount(creatorShare)} NOP</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Rezerv katkısı</span>
                        <span>{formatTokenAmount(reserveShare)} NOP</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Max (slippage {Math.round((BUY_SLIPPAGE - 1) * 100)}%)</span>
                        <span>{formatTokenAmount(maxCost)} NOP</span>
                      </div>
                    </div>
                    {showMinWarning && <p className="muted">Min: {MIN_BUY_TEXT} NOP</p>}
                  </div>

                  <div className="rounded-md bg-muted/40 p-4 text-sm space-y-2">
                    <p className="font-semibold">Ekonomi Notu</p>
                    <p>
                      Creator payı ≈ cost × ({CREATOR_BPS_UI} / 10,000). Rezerv = cost - paylar.
                    </p>
                    <p>Kâr hesaplaması: realized = netSell - maliyet; unrealized = netNow - maliyet (hodl).</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button disabled={!connected || networkMismatch}>Approve NOP</Button>
                    <Button
                      disabled={buyDisabled || buyMutation.isPending}
                      onClick={() => buyMutation.mutate()}
                    >
                      {buyMutation.isPending ? "Buying..." : "Buy"}
                    </Button>
                  </div>

                  <p className="muted">
                    yatırım nop yönetimi tarafından garanti edilmez. bütçenize uygun küçük miktarlarla yatırım öneririz.
                  </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};

export default PoolBuy;
