import { supabase } from "@/lib/supabaseClient";

export const BOOST_TASKS = [
  { key: "signup", title: "Üye ol", reward: 2000 },
  { key: "deposit", title: "Deposit NOP / Cüzdan bağla", reward: 5000 },
  { key: "contribute", title: "Katkı yap (post)", reward: 3000 },
] as const;

export type TaskKey = (typeof BOOST_TASKS)[number]["key"];

type TaskRecord = {
  id?: number;
  user_id: string;
  task_key: string;
  reward_nop: number;
  completed_at: string | null;
  claimed_at: string | null;
};

export async function getUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  const user = data?.user;
  if (!user) throw new Error("Giriş yapmalısın.");
  return user.id;
}

export async function detectCompletion(task: TaskKey, uid?: string) {
  const userId = uid ?? (await getUserId());

  if (task === "signup") {
    return { completed: true, ts: new Date().toISOString() };
  }

  if (task === "deposit") {
    const { data, error } = await supabase
      .from("profiles")
      .select("wallet_address")
      .eq("id", userId)
      .single();
    if (error) throw new Error(error.message);
    const ok = Boolean(data?.wallet_address);
    return { completed: ok, ts: ok ? new Date().toISOString() : null };
  }

  if (task === "contribute") {
    const { data, error } = await supabase
      .from("posts")
      .select("id")
      .eq("author_id", userId)
      .limit(1);
    if (error) throw new Error(error.message);
    const ok = (data?.length ?? 0) > 0;
    return { completed: ok, ts: ok ? new Date().toISOString() : null };
  }

  return { completed: false, ts: null };
}

export async function fetchTaskStates() {
  const uid = await getUserId();
  const { data, error } = await supabase
    .from("user_task_rewards")
    .select("*")
    .eq("user_id", uid);

  if (error) throw new Error(error.message);

  const map = new Map<string, TaskRecord>();
  for (const row of data || []) {
    map.set(row.task_key, row as TaskRecord);
  }
  return map;
}

export async function ensureCompleted(task: TaskKey, reward: number) {
  const uid = await getUserId();
  const { completed, ts } = await detectCompletion(task, uid);
  if (!completed || !ts) return null;

  const { data, error } = await supabase
    .from("user_task_rewards")
    .upsert(
      { user_id: uid, task_key: task, reward_nop: reward, completed_at: ts },
      { onConflict: "user_id,task_key" },
    )
    .select("*")
    .single();

  if (error) {
    console.warn("ensureCompleted", error.message);
    return null;
  }

  return data as TaskRecord;
}

export async function claimTask(task: TaskKey) {
  const uid = await getUserId();

  const { data: rec, error: fetchError } = await supabase
    .from("user_task_rewards")
    .select("*")
    .eq("user_id", uid)
    .eq("task_key", task)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!rec || !rec.completed_at)
    throw new Error("Görev şartı henüz sağlanmadı.");
  if (rec.claimed_at) throw new Error("Bu ödül daha önce alındı.");

  const inc = Number(rec.reward_nop || 0);

  if (typeof supabase.rpc === "function") {
    const noop = await supabase.rpc("noop", {});
    if (noop.error) {
      console.debug("noop rpc skipped", noop.error.message);
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("nop_points")
    .eq("id", uid)
    .single();
  if (profileError) throw new Error(profileError.message);

  const current = Number(profile?.nop_points || 0);
  const updatedPoints = current + inc;

  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({ nop_points: updatedPoints })
    .eq("id", uid);
  if (updateProfileError) throw new Error(updateProfileError.message);

  const { error: claimError } = await supabase
    .from("user_task_rewards")
    .update({ claimed_at: new Date().toISOString() })
    .eq("user_id", uid)
    .eq("task_key", task);

  if (claimError) throw new Error(claimError.message);

  return { ok: true, added: inc };
}
