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
      <Card className="space-y-5 rounded-3xl border border-border bg-card p-5 shadow-card-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Weekly popular pool
          </p>
            <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
          {item.subtitle ? (
              <p className="text-sm text-muted-foreground">{item.subtitle}</p>
          ) : null}
          {item.author ? (
              <p className="text-xs font-semibold text-muted-foreground">by {item.author}</p>
          ) : null}
        </div>
          <div className="flex items-center gap-4">
            {formattedWeeklyVolume ? (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">7d volume</p>
                  <p className="text-2xl font-semibold text-foreground">
                  {formattedWeeklyVolume}
                    <span className="ml-1 text-sm font-medium text-muted-foreground">NOP</span>
                </p>
              </div>
            ) : typeof item.weeklyScore === "number" ? (
              <div className="text-right">
                  <p className="text-xs text-muted-foreground">Weekly score</p>
                  <p className="text-2xl font-semibold text-foreground">
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
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {item.tags.map((tag) => (
            <span
              key={tag}
                className="rounded-full bg-muted px-3 py-1 font-semibold text-foreground"
            >
              {tag.startsWith("#") ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      ) : null}

      {item.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
          {item.description}
        </p>
      ) : null}

      {isPoolActive ? (
          <TradeActions
            contractPostId={contractPostId}
            onSettled={refreshPosition}
              className="bg-muted/50"
          />
      ) : (
          <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Pool will open soon. Follow this contribution for launch updates.
        </div>
      )}

        <p className="text-xs text-muted-foreground">
        Your on-chain position:{" "}
          <span className="font-semibold text-foreground">{formattedPosition} NOP</span>
        {isSyncingPosition ? " · Syncing…" : null}
      </p>
    </Card>
  );
}

export default ContributeCard;
export { ContributeCard };
