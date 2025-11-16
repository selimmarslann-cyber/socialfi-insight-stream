import { type LucideIcon, PenSquare, Sparkles, User, Wallet } from "lucide-react";

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

type IconVisual = {
  Icon: LucideIcon;
  bg: string;
  color: string;
};

const iconVisuals: Record<TaskIconVariant, IconVisual> = {
  signup: {
    Icon: User,
    bg: "rgba(79,70,229,0.1)",
    color: "#4F46E5",
  },
  deposit: {
    Icon: Wallet,
    bg: "rgba(37, 99, 235, 0.12)",
    color: "#2563EB",
  },
  contribute: {
    Icon: PenSquare,
    bg: "rgba(14, 165, 233, 0.12)",
    color: "#0EA5E9",
  },
  default: {
    Icon: Sparkles,
    bg: "rgba(79,70,229,0.12)",
    color: "#4F46E5",
  },
};

const formatReward = (value: number) => {
  if (Number.isNaN(value)) {
    return "0";
  }
  return value.toLocaleString();
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
  const visual = iconVisuals[iconVariant] ?? iconVisuals.default;
  const ActionContent = () => {
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
          className="inline-flex min-w-[160px] items-center justify-center rounded-full bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Claiming…" : "Claim reward"}
        </button>
      );
    }

    if (state === "locked") {
      return (
        <div className="inline-flex min-w-[160px] justify-center rounded-full bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] p-[1.5px]">
          <button
            type="button"
            disabled
            className="inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[#0F172A] opacity-80"
          >
            Complete to unlock
          </button>
        </div>
      );
    }

    return (
      <span className="inline-flex min-w-[160px] items-center justify-center rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-600">
        Reward claimed
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex flex-1 items-start gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/70 shadow-inner"
          style={{
            background: visual.bg,
            color: visual.color,
          }}
        >
          <visual.Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#0F172A]">{title}</p>
          <p className="text-xs text-[#475569]">
            {description || "Detaylar yakında eklenecek."}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-start gap-3 sm:items-end">
        <span className="inline-flex items-center rounded-full bg-[#F5C76A] px-3 py-1 text-[11px] font-bold text-[#0F172A] shadow-sm">
          +{formatReward(reward)} NOP
        </span>
        <ActionContent />
      </div>
    </div>
  );
}

export default TaskCard;
