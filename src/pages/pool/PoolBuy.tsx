import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePoolAccess } from "@/hooks/usePoolAccess";
import { useWalletStore } from "@/lib/store";
import { getPreviewBuyCost } from "@/lib/pool";
import { applyMultiplier } from "@/lib/math";
import { formatTokenAmount } from "@/lib/format";
import {
  BUY_SLIPPAGE,
  CHAIN_ID,
  MIN_BUY_NOP,
} from "@/lib/config";
import { postPoolBuy } from "@/backend/pool";
import { logInvestmentBuy } from "@/lib/orders";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { FeeDistributionCard } from "@/components/pool/FeeDistributionCard";
import { useQuery } from "@tanstack/react-query";
import { getBuyerCount } from "@/lib/contributeHelpers";

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

  const buyerCountQuery = useQuery({
    queryKey: ["buyer-count", postId],
    queryFn: () => getBuyerCount(postIdNumeric),
    enabled: Number.isFinite(postIdNumeric),
  });

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
      <div className="mx-auto max-w-3xl space-y-5">
        <DashboardCard className="space-y-5">
          <DashboardSectionTitle label="Pool" title={`${contribute?.title ?? `Pool #${postId}`} · Buy`} />
            {(contributeLoading || postStateLoading) && <p className="text-sm text-text-secondary">Yükleniyor...</p>}
          {!contributeLoading && !postStateLoading && (
            <>
                <div className="rounded-2xl border border-border-subtle bg-surface-muted px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Pool balance</p>
                  <p className="text-2xl font-semibold text-text-primary">{formatTokenAmount(postState?.reserve ?? 0n)} NOP</p>
              </div>

              {networkMismatch && (
                  <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
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

                <div className="space-y-2 rounded-2xl border border-dashed border-border-subtle/80 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Preview</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Maliyet</span>
                    <span>{formatTokenAmount(cost)} NOP</span>
                  </div>
                    <div className="flex justify-between text-text-secondary">
                    <span>Max (slippage {Math.round((BUY_SLIPPAGE - 1) * 100)}%)</span>
                    <span>{formatTokenAmount(maxCost)} NOP</span>
                  </div>
                </div>
                  {showMinWarning && <p className="text-xs text-warning">Min: {MIN_BUY_TEXT} NOP</p>}
              </div>

                {cost > 0n && (
                  <FeeDistributionCard
                    amount={cost}
                    isBuy={true}
                    buyerCount={buyerCountQuery.data || 0}
                  />
                )}

                <div className="rounded-2xl bg-surface-muted p-4 text-sm text-text-secondary">
                  <p className="font-semibold text-text-primary">Ekonomi notu</p>
                <p>Fair fee distribution: Creator 40%, LPs 30%, Treasury 20%, Early Buyers 10%.</p>
                <p>Kâr hesaplaması: realized = netSell - maliyet; unrealized = netNow - maliyet (hodl).</p>
              </div>

              <div className="flex flex-col gap-3">
                <Button disabled={!connected || networkMismatch}>Approve NOP</Button>
                <Button disabled={buyDisabled || buyMutation.isPending} onClick={() => buyMutation.mutate()}>
                  {buyMutation.isPending ? "Buying..." : "Buy"}
                </Button>
              </div>

                <p className="text-xs text-text-secondary">
                Yatırım NOP yönetimi tarafından garanti edilmez. Bütçenize uygun küçük miktarlarla yatırım öneririz.
              </p>
            </>
          )}
        </DashboardCard>
      </div>
    );
};

export default PoolBuy;
