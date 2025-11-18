import { getSupabase } from "@/lib/supabaseClient";
import type { Database } from "@/integrations/supabase/types";
import type { SocialPosition } from "@/lib/protocol/positions";

export type ReputationScore = Database["public"]["Tables"]["reputation_scores"]["Row"];

const missingSupabaseMessage = "Supabase is not configured.";

const emptyBaseline = (userAddress: string) => ({
  user_address: userAddress,
  total_positions: 0,
  open_positions: 0,
  win_rate: null,
  realized_pnl_usd: 0,
  avg_holding_hours: null,
  last_active_at: null,
  last_computed_at: new Date().toISOString(),
});

export async function recomputeReputationForUser(userAddress: string): Promise<ReputationScore | null> {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn("[protocol] recomputeReputationForUser", missingSupabaseMessage);
    return null;
  }

  const { data: positions, error } = await supabase
    .from("social_positions")
    .select("*")
    .eq("user_address", userAddress);

  if (error) {
    console.error("[protocol] Failed to load positions for reputation", error);
    return null;
  }

  if (!positions || positions.length === 0) {
    const { data: rep } = await supabase
      .from("reputation_scores")
      .upsert(emptyBaseline(userAddress), { onConflict: "user_address" })
      .select()
      .maybeSingle<ReputationScore>();
    return rep ?? null;
  }

  return upsertReputationFromPositions(userAddress, positions as SocialPosition[]);
}

const upsertReputationFromPositions = async (
  userAddress: string,
  positions: SocialPosition[],
): Promise<ReputationScore | null> => {
  const supabase = getSupabase();
  if (!supabase) {
    return null;
  }

  const total = positions.length;
  let wins = 0;
  let realizedPnl = 0;
  let openCount = 0;
  let totalHoldingHours = 0;
  let holdingSamples = 0;
  let lastActiveAt: Date | null = null;

  for (const position of positions) {
    if (position.status === "open") {
      openCount += 1;
    }

    if (typeof position.realized_pnl_usd === "number") {
      realizedPnl += position.realized_pnl_usd;
      if (position.realized_pnl_usd > 0) {
        wins += 1;
      }
    }

    if (position.opened_at) {
      const opened = new Date(position.opened_at);
      const closed = position.closed_at ? new Date(position.closed_at) : new Date();
      const hours = (closed.getTime() - opened.getTime()) / (1000 * 60 * 60);
      if (Number.isFinite(hours) && hours >= 0) {
        totalHoldingHours += hours;
        holdingSamples += 1;
      }
      if (!lastActiveAt || closed > lastActiveAt) {
        lastActiveAt = closed;
      }
    }
  }

  const winRate = total > 0 ? (wins / total) * 100 : null;
  const avgHoldingHours = holdingSamples > 0 ? totalHoldingHours / holdingSamples : null;

  const payload: Database["public"]["Tables"]["reputation_scores"]["Insert"] = {
    user_address: userAddress,
    total_positions: total,
    open_positions: openCount,
    win_rate: winRate,
    realized_pnl_usd: realizedPnl,
    avg_holding_hours: avgHoldingHours,
    last_active_at: lastActiveAt?.toISOString() ?? null,
    last_computed_at: new Date().toISOString(),
  };

  const { data: rep, error: upsertError } = await supabase
    .from("reputation_scores")
    .upsert(payload, { onConflict: "user_address" })
    .select()
    .maybeSingle<ReputationScore>();

  if (upsertError) {
    console.error("[protocol] Failed to upsert reputation score", upsertError);
    return null;
  }

  return rep ?? null;
};

export async function fetchReputationScore(userAddress: string): Promise<ReputationScore | null> {
  const supabase = getSupabase();
  if (!supabase || !userAddress) {
    return null;
  }

  const { data, error } = await supabase
    .from("reputation_scores")
    .select("*")
    .eq("user_address", userAddress)
    .maybeSingle<ReputationScore>();

  if (error) {
    console.warn("[protocol] Failed to fetch reputation score", error);
    return null;
  }

  return data ?? null;
}
