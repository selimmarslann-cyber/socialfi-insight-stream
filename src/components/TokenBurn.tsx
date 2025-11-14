import { useCallback, useEffect, useState } from "react";
import Card from "@/components/Card";
import { getSupabase, supabaseAdminHint } from "@/lib/supabaseClient";

type BurnRow = {
  total_burn: number;
  last_update?: string;
};

export default function TokenBurn({ admin = false }: { admin?: boolean }) {
  const sb = getSupabase();
  const [val, setVal] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sb) {
      setVal(null);
      return;
    }
    try {
      const { data, error } = await sb
        .from("burn_widget")
        .select("*")
        .eq("id", 1)
        .maybeSingle<BurnRow>();

      if (!error && data) {
        setVal(Number(data.total_burn));
        setLastUpdated(data.last_update ?? null);
      } else if (error) {
        throw error;
      } else {
        setVal(0);
      }
    } catch (selectError) {
      console.error("Burn widget load failed", selectError);
      setVal(null);
    }
  }, [sb]);

  const save = async () => {
    if (!admin || val === null || !sb) return;
    setSaving(true);
    try {
      const isoTimestamp = new Date().toISOString();
      const { error } = await sb
        .from("burn_widget")
        .update({ total_burn: val, last_update: isoTimestamp })
        .eq("id", 1);
      if (error) {
        throw error;
      }
      alert("Updated");
      setLastUpdated(isoTimestamp);
    } catch (updateError) {
      alert(
        (updateError as { message?: string } | null)?.message ||
          "Failed to update burn widget",
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    void load();
  }, [load]);

  if (!sb) {
    return (
      <div className="p-3 rounded-xl border bg-white/70 text-[13px]">
        <div className="text-rose-600 font-medium">
          Supabase yapılandırılmadı.
        </div>
        <div className="text-[#475569]">{supabaseAdminHint}</div>
      </div>
    );
  }

  if (val === null) {
    return <Card title="Token Burn" subtitle="Loading…" onRetry={load} />;
  }

  return (
    <Card
      title="Token Burn"
      subtitle={
        lastUpdated
          ? `Last update: ${new Date(lastUpdated).toLocaleString()}`
          : undefined
      }
    >
      <div className="text-2xl font-bold text-slate-800">{val} NOP</div>
      {admin ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="number"
            value={Number.isNaN(val) ? "" : val}
            onChange={(event) => setVal(Number(event.target.value))}
            className="w-40 rounded border border-slate-200 p-2 text-sm"
          />
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      ) : null}
    </Card>
  );
}
