"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getSupabase, supabaseAdminHint } from "@/lib/supabaseClient";
import { getUserSafe } from "@/lib/safeAuth";
import type { Database } from "@/integrations/supabase/types";

// SQL:
// create table if not exists public.boosted_tasks (
//   id uuid primary key default gen_random_uuid(),
//   code text unique not null,
//   title text not null,
//   description text,
//   reward_nop integer not null default 0,
//   order_index integer not null default 0,
//   is_active boolean not null default true,
//   created_at timestamptz default now(),
//   updated_at timestamptz default now()
// );
//
// create table if not exists public.user_tasks (
//   id uuid primary key default gen_random_uuid(),
//   user_id uuid not null references auth.users(id) on delete cascade,
//   task_id uuid not null references public.boosted_tasks(id) on delete cascade,
//   status text not null default 'pending',
//   completed_at timestamptz,
//   claimed_at timestamptz,
//   created_at timestamptz default now(),
//   updated_at timestamptz default now(),
//   unique (user_id, task_id)
// );

type BoostedTaskRow = Database["public"]["Tables"]["boosted_tasks"]["Row"];
type UserTaskRow = Database["public"]["Tables"]["user_tasks"]["Row"];

type TaskState = "locked" | "ready" | "claimed";
type TaskView = BoostedTaskRow & { icon: string; state: TaskState };

const iconMap: Record<string, string> = {
  signup: "👤",
  deposit: "🔗🛒",
  contribute: "✍️",
};

function GoldChip({ children }: { children: ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[12px] bg-[#F5C76A] text-[#0F172A] font-medium shadow-sm">
      {children}
    </span>
  );
}
function Pill({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "gray" | "green" | "red";
}) {
  const map: Record<"gray" | "green" | "red", string> = {
    gray: "bg-gray-100 text-gray-600",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[12px] ${map[tone]}`}>
      {children}
    </span>
  );
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function BoostedTasks() {
  const sb = getSupabase();
  const [state, setState] = useState<TaskView[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const claimedCount = useMemo(
    () => state.filter((r) => r.state === "claimed").length,
    [state],
  );
  const totalTasks = state.length || 3;

  const refresh = useCallback(async () => {
    setErr(null);
    if (!sb) {
      setErr(supabaseAdminHint);
      setState([]);
      return;
    }
    try {
      const { user } = await getUserSafe();
      if (!user) {
        setErr("Oturum açmadın. Lütfen giriş yap.");
        setState([]);
        return;
      }

        const [
          { data: tasks, error: tasksError },
          { data: userTasks, error: userTasksError },
        ] = await Promise.all([
          sb
            .from<BoostedTaskRow>("boosted_tasks")
            .select("*")
            .eq("is_active", true)
            .order("order_index", { ascending: true }),
          sb
            .from<UserTaskRow>("user_tasks")
            .select("*")
            .eq("user_id", user.id),
        ]);

        if (tasksError) {
          throw tasksError;
        }
        if (userTasksError) {
          throw userTasksError;
        }

        const userTaskMap = new Map<string, UserTaskRow>();
        (userTasks ?? []).forEach((record) => {
          userTaskMap.set(record.task_id, record);
        });

        const nextState: TaskView[] = (tasks ?? []).map((task) => {
          const record = userTaskMap.get(task.id);
          const code = task.code ?? "";
          const icon = iconMap[code] ?? "✨";

          const derivedState: TaskState =
            record?.status === "claimed" ? "claimed" : "ready";

          return { ...task, icon, state: derivedState };
        });

        setState(nextState);
    } catch (error) {
      setErr(getErrorMessage(error, "Görevler yüklenemedi."));
      setState([]);
    }
    }, [sb]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function claim(taskId: string) {
    if (!sb) return;
    setBusy(taskId);
    try {
      const { user } = await getUserSafe();
      if (!user) throw new Error("Giriş yapmalısın.");
      const task = state.find((entry) => entry.id === taskId);
      if (!task || task.state !== "ready") {
        throw new Error("Şartlar henüz sağlanmadı.");
      }

      const now = new Date().toISOString();
      const { error } = await sb.from("user_tasks").upsert(
        {
          user_id: user.id,
          task_id: taskId,
          status: "claimed",
          completed_at: now,
          claimed_at: now,
        },
        { onConflict: "user_id,task_id" },
      );
      if (error) {
        throw error;
      }
      await refresh();
    } catch (error) {
      setErr(getErrorMessage(error, "Claim başarısız."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="p-4 rounded-2xl border"
      style={{
        background: "#FFFFFF",
        boxShadow: "0 8px 24px rgba(79,70,229,.08)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="font-semibold text-[#0F172A]">Boosted Tasks</div>
        <div className="text-xs text-[#475569]">
          {claimedCount}/{totalTasks} claimed
        </div>
      </div>
      {err && <div className="mt-2 text-[13px] text-rose-600">{err}</div>}
      <div className="mt-3 space-y-2">
        {state.length === 0 && !err && (
          <div className="text-xs text-[#475569]">Görevler yükleniyor…</div>
        )}
        {state.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between p-3 rounded-xl border bg-white/70"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 grid place-items-center rounded-lg bg-[#F5F8FF] border">
                {task.icon}
              </div>
              <div>
                <div className="font-medium text-[#0F172A]">{task.title}</div>
                <div className="text-xs text-[#475569]">
                  {task.description ?? "Detaylar yakında eklenecek."}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <GoldChip>
                +{Number(task.reward_nop ?? 0).toLocaleString()} NOP
              </GoldChip>
              {task.state === "locked" && <Pill>Complete to unlock</Pill>}
              {task.state === "ready" && (
                <button
                  disabled={busy === task.id}
                  onClick={() => claim(task.id)}
                  className="px-3 py-1.5 rounded-lg border hover:shadow-sm"
                >
                  {busy === task.id ? "Claiming…" : "Claim"}
                </button>
              )}
              {task.state === "claimed" && <Pill tone="green">Claimed ✓</Pill>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
