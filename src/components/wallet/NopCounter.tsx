import { Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/lib/store";

export const NopCounter = () => {
  const navigate = useNavigate();
  const nopBalance = useWalletStore((state) => state.nop);

  const formattedBalance = Number.isFinite(nopBalance)
    ? nopBalance.toLocaleString("tr-TR")
    : "0";

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => navigate("/wallet")}
      className="group h-10 gap-2 rounded-full border border-slate-200 bg-white/90 px-4 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-white focus-visible:ring-2 focus-visible:ring-indigo-100"
      aria-label="NOP balance"
    >
      <Coins className="h-4 w-4 text-amber-500" />
      <span className="font-mono text-sm text-slate-900 transition group-hover:text-slate-900">
        {formattedBalance}
      </span>
      <span className="hidden text-[11px] uppercase tracking-wide text-slate-500 md:inline">
        NOP
      </span>
    </Button>
  );
};
