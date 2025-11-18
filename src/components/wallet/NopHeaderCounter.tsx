import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/lib/store";

export function NopHeaderCounter() {
  const navigate = useNavigate();
  const nopBalance = useWalletStore((state) => state.nop);

  return (
    <button
      type="button"
      onClick={() => navigate("/wallet")}
      className={cn(
        "inline-flex items-center gap-2 rounded-pill border border-border-subtle/60 bg-white/80 px-3.5 py-1.5",
        "shadow-subtle transition hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-start)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
      )}
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-gold-chip)] text-[11px] font-bold text-slate-900 ring-2 ring-white/60">
        N
      </div>
      <div className="flex flex-col items-start leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">NOP Balance</span>
        <span className="text-sm-2 font-semibold text-text-primary tabular-nums">{nopBalance.toLocaleString()}</span>
      </div>
    </button>
  );
}
