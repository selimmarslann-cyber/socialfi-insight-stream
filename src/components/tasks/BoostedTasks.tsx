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
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";

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
      // Fetch boosted tasks
      const { data: tasks, error: tasksError } = await sb
        .from<BoostedTaskRow>("boosted_tasks")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (tasksError) {
        // If table doesn't exist or is empty, create default tasks
        if (tasksError.code === "42P01" || (tasks && tasks.length === 0)) {
          // Initialize default tasks if table is empty
          const defaultTasks = [
            {
              code: "signup",
              title: "Connect Wallet",
              description: "Connect your wallet to get started",
              reward_nop: 2000,
              order_index: 1,
              is_active: true,
            },
            {
              code: "contribute",
              title: "Create Your First Post",
              description: "Share your first contribution with the community",
              reward_nop: 3000,
              order_index: 2,
              is_active: true,
            },
            {
              code: "deposit",
              title: "Make Your First Investment",
              description: "Invest in a contribution to unlock rewards",
              reward_nop: 5000,
              order_index: 3,
              is_active: true,
            },
          ];

          // Try to insert default tasks (ignore if they already exist)
          for (const task of defaultTasks) {
            try {
              await sb.from("boosted_tasks").insert(task).select().single();
            } catch (insertError) {
              // Ignore duplicate errors
              console.warn("[BoostedTasks] Could not insert default task", insertError);
            }
          }

          // Retry fetching tasks
          const { data: retryTasks } = await sb
            .from<BoostedTaskRow>("boosted_tasks")
            .select("*")
            .eq("is_active", true)
            .order("order_index", { ascending: true });

          if (retryTasks && retryTasks.length > 0) {
            // Process with retryTasks
            const walletClaims = walletKey ? getWalletClaimsFor(walletKey) : {};
            const canClaim = Boolean(walletKey);

            // Check task completion status based on wallet
            const nextState: TaskView[] = retryTasks.map((task) => {
              const code = task.code ?? "";
              const iconVariant = iconKeyMap[code] ?? "default";
              const claimedViaWallet = walletKey && walletClaims ? Boolean(walletClaims[task.id]) : false;

              // Determine if task is completed
              let isCompleted = false;
              if (walletKey) {
                if (code === "signup") {
                  // Signup is completed if wallet is connected
                  isCompleted = true;
                } else if (code === "contribute") {
                  // Check if user has created a post
                  // This will be checked dynamically
                  isCompleted = false;
                } else if (code === "deposit") {
                  // Check if user has made an investment
                  // This will be checked dynamically
                  isCompleted = false;
                }
              }

              const derivedState: TaskState = claimedViaWallet
                ? "claimed"
                : isCompleted && canClaim
                ? "ready"
                : canClaim
                ? "ready"
                : "locked";

              return { ...task, iconVariant, state: derivedState };
            });

            setState(nextState);
            return;
          }
        } else {
          throw tasksError;
        }
      }

      // If tasks exist, process them
      if (!tasks || tasks.length === 0) {
        setState([]);
        if (!walletKey) {
          setNotice("Ödülleri almak için cüzdanını bağla.");
        }
        return;
      }

      // Fetch user tasks by wallet_address (wallet-based)
      let userTasks: UserTaskRow[] = [];
      if (walletKey) {
        // Try to get profile ID from wallet
        const { data: profile } = await sb
          .from("social_profiles")
          .select("id")
          .eq("wallet_address", walletKey)
          .maybeSingle();

        if (profile?.id) {
          // For now, we'll use wallet-based claims stored in localStorage
          // In the future, we can create a wallet_tasks table
        }
      }

      const walletClaims = walletKey ? getWalletClaimsFor(walletKey) : {};
      const canClaim = Boolean(walletKey);

      // Check task completion dynamically
      const nextState: TaskView[] = tasks.map((task) => {
        const code = task.code ?? "";
        const iconVariant = iconKeyMap[code] ?? "default";
        const claimedViaWallet = walletKey && walletClaims ? Boolean(walletClaims[task.id]) : false;

        // Determine if task is completed (will be checked dynamically)
        let isCompleted = false;
        if (walletKey) {
          if (code === "signup") {
            // Signup is completed if wallet is connected
            isCompleted = true;
          }
          // Other tasks will be checked in real-time
        }

        const derivedState: TaskState = claimedViaWallet
          ? "claimed"
          : isCompleted && canClaim
          ? "ready"
          : canClaim
          ? "ready"
          : "locked";

        return { ...task, iconVariant, state: derivedState };
      });

      setState(nextState);

      if (!walletKey) {
        setNotice("Ödülleri almak için cüzdanını bağla.");
      }
    } catch (error) {
      console.error("[BoostedTasks] Refresh error", error);
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
      if (!walletKey) {
        throw new Error("Önce cüzdan bağla.");
      }

      // Check if task is actually completed
      let isTaskCompleted = false;
      if (task.code === "signup") {
        // Signup is always completed if wallet is connected
        isTaskCompleted = true;
      } else if (task.code === "contribute") {
        // Check if user has created at least one post
        if (sb) {
          const { data: posts } = await sb
            .from("social_posts")
            .select("id")
            .eq("wallet_address", walletKey)
            .limit(1);
          isTaskCompleted = (posts?.length ?? 0) > 0;
        }
      } else if (task.code === "deposit") {
        // Check if user has made at least one investment
        if (sb) {
          const { data: trades } = await sb
            .from("nop_trades")
            .select("id")
            .eq("wallet_address", walletKey)
            .eq("side", "buy")
            .limit(1);
          isTaskCompleted = (trades?.length ?? 0) > 0;
        }
      }

      if (!isTaskCompleted) {
        throw new Error("Bu görevi tamamlamak için gerekli şartları sağlamalısınız.");
      }

      // Mark as claimed in localStorage (wallet-based)
      markWalletClaim(walletKey, taskId);
      const reward = Number(task.reward_nop ?? 0);
      if (reward > 0) {
        grantNop?.(reward);
      }

      // Update state optimistically
      setState((prev) =>
        prev.map((entry) =>
          entry.id === taskId ? { ...entry, state: "claimed" } : entry,
        ),
      );

      // Try to save to database if profile exists
      if (sb) {
        const { data: profile } = await sb
          .from("social_profiles")
          .select("id")
          .eq("wallet_address", walletKey)
          .maybeSingle();

        if (profile?.id) {
          // Try to save to user_tasks if table exists and has wallet_address column
          // For now, we'll just use localStorage
        }
      }

      setNotice("Ödül başarıyla alındı!");
      await refresh();
    } catch (error) {
      setErr(getErrorMessage(error, "Claim başarısız."));
    } finally {
      setBusy(null);
    }
  }

  const showSkeleton = !err && state.length === 0;

  return (
    <DashboardCard className="p-4 md:p-5">
        <DashboardSectionTitle
          label="Onboarding"
          title="Boosted Tasks"
          action={<span className="text-xs font-semibold text-text-secondary">({claimedCount}/{totalTasks})</span>}
        />

        {err ? (
          <div className="rounded-2xl border border-error/20 bg-error/10 px-3 py-2 text-[12px] font-medium text-error">
            {err}
          </div>
        ) : null}

        {notice ? (
          <div className="rounded-2xl border border-border-subtle bg-surface-muted px-3 py-2 text-[12px] text-text-secondary">
            {notice}
          </div>
        ) : null}

      <div className="mt-3 space-y-3">
        {showSkeleton
            ? Array.from({ length: totalTasks }).map((_, index) => (
                <div
                  key={`boosted-task-skeleton-${index}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-muted/80 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-surface opacity-70" />
                    <div className="space-y-1">
                      <div className="h-3 w-28 rounded-full bg-surface opacity-60" />
                      <div className="h-3 w-20 rounded-full bg-surface opacity-60" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="h-5 w-20 rounded-full bg-amber-100/60 dark:bg-amber-500/20" />
                    <div className="h-5 w-24 rounded-full bg-sky-100/70 dark:bg-sky-500/20" />
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
    </DashboardCard>
  );
}
