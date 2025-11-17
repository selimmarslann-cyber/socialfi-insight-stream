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
        "inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-50/80 px-3 py-1.5",
        "shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200",
      )}
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-[11px] font-bold text-slate-900">
        N
      </div>
      <div className="flex flex-col items-start leading-tight">
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-amber-700/80">NOP Balance</span>
        <span className="text-xs font-semibold text-slate-900 tabular-nums">{nopBalance.toLocaleString()}</span>
      </div>
    </button>
  );
}
