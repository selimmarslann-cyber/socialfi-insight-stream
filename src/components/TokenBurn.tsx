import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { supabase } from "@/lib/supabaseClient";

type BurnRow = {
  total_burn: number;
  last_update?: string;
};

export default function TokenBurn({ admin = false }: { admin?: boolean }) {
  const [val, setVal] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const supabaseReady = Boolean(supabase);

  const load = async () => {
    if (!supabase) {
      setVal(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("burn_widget")
        .select("*")
        .eq("id", 1)
        .maybeSingle<BurnRow>();

      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-console
        console.log("BURN_WIDGET_SELECT", data, error);
      }

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
  };

  const save = async () => {
    if (!admin || val === null || !supabase) return;
    setSaving(true);
    try {
      const isoTimestamp = new Date().toISOString();
      const { error } = await supabase
        .from("burn_widget")
        .update({ total_burn: val, last_update: isoTimestamp })
        .eq("id", 1);
      if (error) {
        throw error;
      }
      alert("Updated");
      setLastUpdated(isoTimestamp);
    } catch (updateError) {
      alert((updateError as { message?: string } | null)?.message || "Failed to update burn widget");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (supabase) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!supabaseReady) {
    return (
      <Card
        title="Token Burn"
        error="Supabase yapılandırılmadı. Yönetici: VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY ekleyin."
      />
    );
  }

  if (val === null) {
    return <Card title="Token Burn" subtitle="Loading…" onRetry={load} />;
  }

  return (
    <Card
      title="Token Burn"
      subtitle={lastUpdated ? `Last update: ${new Date(lastUpdated).toLocaleString()}` : undefined}
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
