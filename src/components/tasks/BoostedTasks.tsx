"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase, supabaseAdminHint } from "@/lib/supabaseClient";
import { getUserSafe } from "@/lib/safeAuth";
import { useWalletStore } from "@/lib/store";
import type { Database } from "@/integrations/supabase/types";
import TaskCard, {
  type TaskIconVariant,
  type TaskState,
} from "@/components/tasks/TaskCard";

type BoostedTaskRow = Database["public"]["Tables"]["boosted_tasks"]["Row"];
type UserTaskRow = Database["public"]["Tables"]["user_tasks"]["Row"];
type TaskView = BoostedTaskRow & { iconVariant: TaskIconVariant; state: TaskState };

const iconKeyMap: Record<string, TaskIconVariant> = {
  signup: "signup",
  deposit: "deposit",
  contribute: "contribute",
};

const WALLET_CLAIM_STORAGE = "nop.walletTaskClaims";

type WalletClaimStore = Record<string, Record<string, number>>;

const isBrowser = () => typeof window !== "undefined";

const readWalletClaimStore = (): WalletClaimStore => {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(WALLET_CLAIM_STORAGE);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as WalletClaimStore;
    }
  } catch {
    // ignore
  }
  return {};
};

const writeWalletClaimStore = (store: WalletClaimStore) => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(WALLET_CLAIM_STORAGE, JSON.stringify(store));
  } catch {
    // ignore
  }
};

const getWalletClaimsFor = (walletId: string) => {
  const store = readWalletClaimStore();
  return store[walletId.toLowerCase()] ?? {};
};

const markWalletClaim = (walletId: string, taskId: string) => {
  const store = readWalletClaimStore();
  const key = walletId.toLowerCase();
  const next = {
    ...(store[key] ?? {}),
    [taskId]: Date.now(),
  };
  store[key] = next;
  writeWalletClaimStore(store);
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function BoostedTasks() {
  const sb = getSupabase();
  const [state, setState] = useState<TaskView[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const connected = useWalletStore((wallet) => wallet.connected);
  const address = useWalletStore((wallet) => wallet.address);
  const grantNop = useWalletStore((wallet) => wallet.grantNop);
  const walletKey = connected && address ? address.toLowerCase() : null;

  const claimedCount = useMemo(
    () => state.filter((record) => record.state === "claimed").length,
    [state],
  );
  const totalTasks = state.length || 3;

  const refresh = useCallback(async () => {
    setErr(null);
    setNotice(null);
    if (!sb) {
      setErr(supabaseAdminHint);
      setState([]);
      return;
    }
    try {
      const { user } = await getUserSafe();
      const supabaseUserId = user?.id ?? null;
      const [{ data: tasks, error: tasksError }, { data: userTasks, error: userTasksError }] =
        await Promise.all([
          sb
            .from<BoostedTaskRow>("boosted_tasks")
            .select("*")
            .eq("is_active", true)
            .order("order_index", { ascending: true }),
          supabaseUserId
            ? sb
                .from<UserTaskRow>("user_tasks")
                .select("*")
                .eq("user_id", supabaseUserId)
            : Promise.resolve({ data: [], error: null }),
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

      const walletClaims = walletKey ? getWalletClaimsFor(walletKey) : {};

      if (!supabaseUserId) {
        if (walletKey) {
          setNotice("Demo mod: Claimler cüzdanına yerel olarak kaydediliyor.");
        } else {
          setNotice("Ödülleri almak için cüzdanını bağla.");
        }
      }

      const canClaim = Boolean(supabaseUserId || walletKey);
      const nextState: TaskView[] = (tasks ?? []).map((task) => {
        const record = userTaskMap.get(task.id);
        const code = task.code ?? "";
        const iconVariant = iconKeyMap[code] ?? "default";

        const claimedViaWallet =
          walletKey && walletClaims ? Boolean(walletClaims[task.id]) : false;
        const claimed = record?.status === "claimed" || claimedViaWallet;

        const derivedState: TaskState = claimed
          ? "claimed"
          : canClaim
          ? "ready"
          : "locked";

        return { ...task, iconVariant, state: derivedState };
      });

      setState(nextState);
    } catch (error) {
      setErr(getErrorMessage(error, "Görevler yüklenemedi."));
      setState([]);
    }
  }, [sb, walletKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function claim(taskId: string) {
    const task = state.find((entry) => entry.id === taskId);
    if (!task || task.state !== "ready") {
      return;
    }
    setBusy(taskId);
    try {
      const { user } = await getUserSafe();
      if (user) {
        if (!sb) {
          throw new Error(supabaseAdminHint);
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
        return;
      }

      if (walletKey) {
        markWalletClaim(walletKey, taskId);
        const reward = Number(task.reward_nop ?? 0);
        if (reward > 0) {
          grantNop?.(reward);
        }
        setState((prev) =>
          prev.map((entry) =>
            entry.id === taskId ? { ...entry, state: "claimed" } : entry,
          ),
        );
        setNotice("Claim kaydedildi (demo).");
        return;
      }

      throw new Error("Önce cüzdan bağla veya giriş yap.");
    } catch (error) {
      setErr(getErrorMessage(error, "Claim başarısız."));
    } finally {
      setBusy(null);
    }
  }

  const showSkeleton = !err && state.length === 0;

  return (
    <section className="rounded-3xl border border-slate-100 bg-white px-4 pt-4 pb-3 shadow-sm flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <div className="flex flex-col gap-1">
          <div className="text-[15px] font-semibold text-slate-900">Boosted Tasks</div>
          <div className="text-[12px] text-slate-500">Complete tasks &amp; earn NOP</div>
        </div>
        <div className="text-[12px] font-medium text-slate-400">
          ({claimedCount}/{totalTasks})
        </div>
        </div>
        <div className="h-px w-full rounded-full bg-slate-200/80" />

        {err ? <p className="text-[11px] font-semibold text-rose-600">{err}</p> : null}

        {notice ? <p className="text-[11px] text-slate-500">{notice}</p> : null}

      <div className="space-y-3">
        {showSkeleton
          ? Array.from({ length: totalTasks }).map((_, index) => (
              <div
                key={`boosted-task-skeleton-${index}`}
                className="rounded-2xl border border-slate-100 bg-slate-50/40 px-3 py-2.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-full bg-white/80" />
                  <div className="space-y-1">
                    <div className="h-3 w-28 rounded-full bg-slate-100" />
                    <div className="h-3 w-20 rounded-full bg-slate-100" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="h-5 w-20 rounded-full bg-amber-100/60" />
                  <div className="h-5 w-24 rounded-full bg-sky-100/70" />
                </div>
              </div>
            ))
          : state.map((task) => (
              <TaskCard
                key={task.id}
                title={task.title}
                description={task.description}
                reward={Number(task.reward_nop ?? 0)}
                state={task.state}
                iconVariant={task.iconVariant}
                busy={busy === task.id}
                onClaim={() => claim(task.id)}
              />
            ))}
      </div>
    </section>
  );
}
