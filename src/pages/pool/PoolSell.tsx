import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePoolAccess } from "@/hooks/usePoolAccess";
import { useWalletStore } from "@/lib/store";
import { getPreviewSell, getUserShares } from "@/lib/pool";
import { applyMultiplier } from "@/lib/math";
import { formatTokenAmount } from "@/lib/format";
import { CHAIN_ID, SELL_FEE_BPS_UI, SELL_SLIPPAGE } from "@/lib/config";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";

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
      <div className="mx-auto max-w-3xl space-y-5">
        <DashboardCard className="space-y-5">
          <DashboardSectionTitle label="Pool" title={`${contribute?.title ?? `Pool #${postId}`} · Sell`} />
          {(contributeLoading || postStateLoading) && <p className="text-sm text-slate-500">Yükleniyor...</p>}
          {!contributeLoading && !postStateLoading && (
            <>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Toplam payınız</p>
                <p className="text-2xl font-semibold text-slate-900">{userShares.toString()}</p>
              </div>

              {networkMismatch && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-800">
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
                {exceedingBalance && <p className="text-xs text-rose-600">Pay miktarı bakiyenizi aşamaz.</p>}
              </div>

              <div className="space-y-2 rounded-2xl border border-dashed border-slate-200 p-4 text-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Preview</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Brüt</span>
                    <span>{formatTokenAmount(preview.gross)} NOP</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Fee (%{SELL_FEE_BPS_UI / 100})</span>
                    <span>{formatTokenAmount(preview.fee)} NOP</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Net</span>
                    <span>{formatTokenAmount(preview.net)} NOP</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Min (slippage {Math.round((1 - SELL_SLIPPAGE) * 100)}%)</span>
                    <span>{formatTokenAmount(minNet)} NOP</span>
                  </div>
                </div>
              </div>

              {reserveInsufficient && <p className="text-xs text-amber-600">Rezerv yetersiz.</p>}

              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Ekonomi notu</p>
                <p>Net = gross × (1 - {SELL_FEE_BPS_UI} / 10,000).</p>
                <p>Kâr hesaplaması: realized = netSell - maliyet; unrealized = netNow - maliyet (hodl).</p>
              </div>

              <Button disabled={sellDisabled}>Sell</Button>

              <p className="text-xs text-slate-500">Satış işlemleri geri alınamaz.</p>
            </>
          )}
        </DashboardCard>
      </div>
    );
};

export default PoolSell;
