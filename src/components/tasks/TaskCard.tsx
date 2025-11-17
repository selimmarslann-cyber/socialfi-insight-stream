import clsx from "clsx";
import { PenSquare, Sparkles, User, Wallet } from "lucide-react";

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
    "h-7 w-7 rounded-full flex items-center justify-center text-[13px] font-medium",
    iconVariant === "signup" && "bg-indigo-100 text-indigo-600",
    iconVariant === "deposit" && "bg-sky-100 text-sky-600",
    iconVariant === "contribute" && "bg-amber-100 text-amber-600",
    iconVariant === "default" && "bg-slate-100 text-slate-600",
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
          className="text-[11px] font-medium text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 rounded-full px-2.5 py-0.5 leading-none shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? "Claiming…" : "Claim reward"}
        </button>
      );
    }

    if (state === "locked") {
      return (
        <button
          type="button"
          aria-disabled="true"
          className="text-[11px] font-medium text-indigo-600 bg-sky-50 hover:bg-sky-100 rounded-full px-2.5 py-0.5 leading-none transition cursor-not-allowed"
        >
          Complete to unlock
        </button>
      );
    }

    return (
      <div className="text-[11px] font-medium text-emerald-600 bg-emerald-50 rounded-full px-2.5 py-0.5">
        Claimed
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/40 px-3 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={iconWrapperClassName}>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="text-[13px] font-semibold text-slate-900 truncate">
            {title}
          </div>
          <div className="text-[11px] leading-snug text-slate-500 line-clamp-2">
            {description || "Detaylar yakında eklenecek."}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5">
          <span className="text-[11px] font-semibold text-amber-700">
            +{formatReward(reward)} NOP
          </span>
        </div>
        {renderAction()}
      </div>
    </div>
  );
}

export default TaskCard;
