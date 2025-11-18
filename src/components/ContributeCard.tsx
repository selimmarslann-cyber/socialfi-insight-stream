import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUnits } from "ethers";
import type { Contribute } from "@/lib/types";
import { TradeActions } from "@/components/pool/TradeActions";
import { getUserPosition } from "@/lib/pool";

type ContributeCardProps = {
  item: Contribute;
};

function ContributeCard({ item }: ContributeCardProps) {
  const [positionWei, setPositionWei] = useState<bigint>(0n);
  const [isSyncingPosition, setIsSyncingPosition] = useState(false);
  const contractPostId = typeof item.contractPostId === "number" ? item.contractPostId : null;
  const isPoolActive = item.poolEnabled === true && contractPostId !== null;
  const weeklyVolume =
    typeof item.weeklyVolumeNop === "number" ? item.weeklyVolumeNop : null;

  const refreshPosition = useCallback(async () => {
    if (!isPoolActive || contractPostId === null) return;
    if (typeof window === "undefined" || !window.ethereum) return;

    try {
      setIsSyncingPosition(true);
      const accounts = (await window.ethereum.request({
        method: "eth_accounts",
      })) as string[];
      const address = accounts?.[0];
      if (!address) return;
      const result = await getUserPosition(contractPostId, address);
      setPositionWei(result?.shares ?? 0n);
    } catch (error) {
      console.error("[ContributeCard] Failed to fetch position", error);
    } finally {
      setIsSyncingPosition(false);
    }
  }, [contractPostId, isPoolActive]);

  useEffect(() => {
    void refreshPosition();
  }, [refreshPosition]);

  const formattedPosition = useMemo(
    () => formatUnits(positionWei ?? 0n, 18),
    [positionWei],
  );
  const volumeFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [],
  );
  const formattedWeeklyVolume =
    weeklyVolume === null ? null : volumeFormatter.format(weeklyVolume);

  return (
    <Card className="space-y-5 rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Weekly popular pool
          </p>
          <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
          {item.subtitle ? (
            <p className="text-sm text-slate-500">{item.subtitle}</p>
          ) : null}
          {item.author ? (
            <p className="text-xs font-semibold text-slate-500">by {item.author}</p>
          ) : null}
        </div>
          <div className="flex items-center gap-4">
            {formattedWeeklyVolume ? (
              <div className="text-right">
                <p className="text-xs text-slate-500">7d volume</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {formattedWeeklyVolume}
                  <span className="ml-1 text-sm font-medium text-slate-500">NOP</span>
                </p>
              </div>
            ) : typeof item.weeklyScore === "number" ? (
              <div className="text-right">
                <p className="text-xs text-slate-500">Weekly score</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {item.weeklyScore}
                </p>
              </div>
            ) : null}
          <Badge
            variant={isPoolActive ? "secondary" : "outline"}
            className={isPoolActive ? "bg-emerald-50 text-emerald-600" : ""}
          >
            {isPoolActive ? "Active" : "Locked"}
          </Badge>
        </div>
      </div>

      {item.tags?.length ? (
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-3 py-1 font-semibold"
            >
              {tag.startsWith("#") ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      ) : null}

      {item.description ? (
        <p className="text-sm leading-relaxed text-slate-600">
          {item.description}
        </p>
      ) : null}

      {isPoolActive ? (
          <TradeActions
            contractPostId={contractPostId}
            onSettled={refreshPosition}
            className="bg-slate-50/80"
          />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          Pool will open soon. Follow this contribution for launch updates.
        </div>
      )}

      <p className="text-xs text-slate-500">
        Your on-chain position:{" "}
        <span className="font-semibold text-slate-900">{formattedPosition} NOP</span>
        {isSyncingPosition ? " · Syncing…" : null}
      </p>
    </Card>
  );
}

export default ContributeCard;
export { ContributeCard };
