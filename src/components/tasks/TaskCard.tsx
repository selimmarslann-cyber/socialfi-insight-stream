import clsx from "clsx";
import { Check, PenSquare, Sparkles, User, Wallet } from "lucide-react";

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
    "flex h-9 w-9 items-center justify-center rounded-2xl border text-[13px] font-medium",
    iconVariant === "signup" && "border-indigo-100 bg-indigo-50 text-indigo-600",
    iconVariant === "deposit" && "border-cyan-100 bg-cyan-50 text-cyan-600",
    iconVariant === "contribute" && "border-amber-100 bg-amber-50 text-amber-600",
    iconVariant === "default" && "border-slate-100 bg-slate-50 text-slate-600",
  );

  const renderAction = () => {
    if (state === "ready") {
      return (
        <button
          type="button"
          onClick={() => {
            if (!busy) {
              onClaim?.();
            }
          }}
          disabled={busy}
          className="inline-flex items-center rounded-full bg-gradient-to-r from-[var(--color-accent-indigo)] to-[var(--color-accent-cyan)] px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Claiming…" : "Claim reward"}
        </button>
      );
    }

    if (state === "locked") {
      return (
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
          Complete first
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
        <Check className="h-3 w-3" />
        Claimed
      </div>
    );
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-3 py-2.5 shadow-sm">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={iconWrapperClassName}>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="text-sm font-semibold text-slate-900 truncate">{title}</div>
          <div className="text-xs leading-snug text-slate-500 line-clamp-2">
            {description || "Detaylar yakında eklenecek."}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="inline-flex items-center rounded-full border border-amber-200/70 bg-amber-50/80 px-2.5 py-0.5">
          <span className="text-xs font-semibold text-amber-700 tabular-nums">
            +{formatReward(reward)} NOP
          </span>
        </div>
        {renderAction()}
      </div>
    </div>
  );
}

export default TaskCard;
