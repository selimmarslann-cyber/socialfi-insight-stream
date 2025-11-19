import clsx from "clsx";
import { Check, PenSquare, Sparkles, User, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";

export type TaskState = "locked" | "ready" | "claimed";

export type TaskIconVariant = "signup" | "deposit" | "contribute" | "default";

type TaskCardProps = {
  title: string;
  description?: string | null;
  reward: number;
  state: TaskState;
  iconVariant: TaskIconVariant;
  busy?: boolean;
  onClaim?: () => void;
};

const iconVisuals: Record<TaskIconVariant, typeof User> = {
  signup: User,
  deposit: Wallet,
  contribute: PenSquare,
  default: Sparkles,
};

const formatReward = (value: number) => {
  if (Number.isNaN(value)) {
    return "0";
  }

  return value.toLocaleString("en-US");
};

export function TaskCard({
  title,
  description,
  reward,
  state,
  busy,
  iconVariant,
  onClaim,
}: TaskCardProps) {
  const Icon = iconVisuals[iconVariant] ?? iconVisuals.default;

    const iconWrapperClassName = clsx(
      "flex h-10 w-10 items-center justify-center rounded-2xl text-[13px] font-medium",
      "ring-1 ring-border-subtle/70 bg-surface-muted text-text-secondary",
      iconVariant === "signup" &&
        "bg-indigo-50 text-indigo-600 ring-indigo-100/80 dark:bg-indigo-500/20 dark:text-indigo-100 dark:ring-indigo-400/40",
      iconVariant === "deposit" &&
        "bg-cyan-50 text-cyan-600 ring-cyan-100/80 dark:bg-cyan-500/20 dark:text-cyan-100 dark:ring-cyan-400/40",
      iconVariant === "contribute" &&
        "bg-amber-50 text-amber-600 ring-amber-100/80 dark:bg-amber-500/20 dark:text-amber-100 dark:ring-amber-300/40",
    );

  const renderAction = () => {
    if (state === "ready") {
      return (
        <Button
          size="sm"
          variant="accent"
          onClick={() => {
            if (!busy) {
              onClaim?.();
            }
          }}
          disabled={busy}
        >
          {busy ? "Claiming…" : "Claim reward"}
        </Button>
      );
    }

    if (state === "locked") {
      return <StatusPill tone="muted">Locked</StatusPill>;
    }

    return (
      <StatusPill tone="success" className="gap-1.5">
        <Check className="h-3 w-3" />
        Claimed
      </StatusPill>
    );
  };

  return (
    <div className="flex items-start justify-between gap-3 rounded-[16px] border border-border-subtle bg-surface px-3.5 py-3 shadow-subtle/30">
      <div className="flex min-w-0 items-center gap-3">
        <div className={iconWrapperClassName}>
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="truncate text-base font-semibold text-text-primary">{title}</div>
          <div className="text-sm-2 leading-snug text-text-secondary line-clamp-2">
            {description || "Detaylar yakında eklenecek."}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <StatusPill className="bg-[var(--color-gold-chip)] text-slate-900 ring-0">
          +{formatReward(reward)} NOP
        </StatusPill>
        {renderAction()}
      </div>
    </div>
  );
}

export default TaskCard;
