/**
 * Referral System
 * Handles referral codes, tracking, and rewards
 */

import { supabase } from "@/lib/supabaseClient";
import { useWalletStore } from "@/lib/store";
import { calculateFairReferralReward, normalizeReward } from "@/lib/fairData";

export type Referral = {
  id: string;
  referrerAddress: string;
  referredAddress: string;
  referralCode: string;
  rewardNop: number;
  status: "pending" | "completed" | "cancelled";
  completedAt?: string;
  createdAt: string;
};

export type ReferralStats = {
  totalReferrals: number;
  completedReferrals: number;
  totalRewards: number;
  pendingRewards: number;
};

// Rewards are calculated dynamically to prevent inflation
// Base amounts are normalized based on platform activity
const BASE_REFERRAL_REWARD = 10; // Base NOP tokens (will be normalized)
const BASE_REFERRER_REWARD = 5; // Base NOP tokens (will be normalized)

/**
 * Generate a unique referral code for a wallet
 */
export async function generateReferralCode(walletAddress: string): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }

  const normalized = walletAddress.toLowerCase().trim();
  const shortAddress = normalized.slice(-8).toUpperCase();
  const timestamp = Date.now().toString(36).slice(-4);
  const code = `NOP-${shortAddress}-${timestamp}`;

  // Check if code already exists
  const { data: existing } = await supabase
    .from("social_profiles")
    .select("referral_code")
    .eq("referral_code", code)
    .single();

  if (existing) {
    // Regenerate with different timestamp
    return `NOP-${shortAddress}-${Date.now().toString(36).slice(-4)}`;
  }

  return code;
}

/**
 * Get or create referral code for current user
 */
export async function getOrCreateReferralCode(walletAddress: string): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }

  const normalized = walletAddress.toLowerCase().trim();

  // Check if user already has a referral code
  const { data: profile } = await supabase
    .from("social_profiles")
    .select("referral_code")
    .eq("wallet_address", normalized)
    .single();

  if (profile?.referral_code) {
    return profile.referral_code;
  }

  // Generate new referral code
  const code = await generateReferralCode(normalized);

  // Update profile with referral code
  const { error } = await supabase
    .from("social_profiles")
    .update({ referral_code: code })
    .eq("wallet_address", normalized);

  if (error) {
    console.error("[referral] Failed to set referral code", error);
    throw error;
  }

  return code;
}

/**
 * Register a referral (when new user signs up with referral code)
 */
export async function registerReferral(
  referredAddress: string,
  referralCode: string
): Promise<Referral | null> {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }

  const normalizedReferred = referredAddress.toLowerCase().trim();

  // Find referrer by code
  const { data: referrerProfile, error: findError } = await supabase
    .from("social_profiles")
    .select("wallet_address")
    .eq("referral_code", referralCode)
    .single();

  if (findError || !referrerProfile) {
    throw new Error("Invalid referral code");
  }

  const referrerAddress = referrerProfile.wallet_address?.toLowerCase().trim();
  if (!referrerAddress) {
    throw new Error("Referrer address not found");
  }

  // Check if already referred
  const { data: existing } = await supabase
    .from("referrals")
    .select("id")
    .eq("referred_address", normalizedReferred)
    .single();

  if (existing) {
    throw new Error("Address already has a referral");
  }

  // Calculate fair reward (prevents inflation)
  const fairReward = await calculateFairReferralReward();
  const normalizedReward = normalizeReward(fairReward, "referral");

  // Create referral record
  const { data: referral, error: insertError } = await supabase
    .from("referrals")
    .insert({
      referrer_address: referrerAddress,
      referred_address: normalizedReferred,
      referral_code: referralCode,
      reward_nop: normalizedReward,
      status: "pending",
    })
    .select("*")
    .single();

  if (insertError) {
    console.error("[referral] Failed to create referral", insertError);
    throw insertError;
  }

  // Update referrer's referral count
  await supabase.rpc("increment_referral_count", {
    wallet_addr: referrerAddress,
  });

  return {
    id: referral.id,
    referrerAddress: referral.referrer_address,
    referredAddress: referral.referred_address,
    referralCode: referral.referral_code,
    rewardNop: Number(referral.reward_nop),
    status: referral.status,
    completedAt: referral.completed_at,
    createdAt: referral.created_at,
  };
}

/**
 * Complete a referral (when referred user completes an action)
 */
export async function completeReferral(referredAddress: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }

  const normalized = referredAddress.toLowerCase().trim();

  // Find pending referral
  const { data: referral, error: findError } = await supabase
    .from("referrals")
    .select("*")
    .eq("referred_address", normalized)
    .eq("status", "pending")
    .single();

  if (findError || !referral) {
    return; // No pending referral
  }

  // Update referral status
  const { error: updateError } = await supabase
    .from("referrals")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", referral.id);

  if (updateError) {
    console.error("[referral] Failed to complete referral", updateError);
    throw updateError;
  }

  // Award rewards (this would typically trigger a smart contract or treasury action)
  // For now, we just record it
  console.log("[referral] Referral completed", {
    referrer: referral.referrer_address,
    referred: referral.referred_address,
    reward: referral.reward_nop,
  });
}

/**
 * Get referral stats for a wallet
 */
export async function getReferralStats(walletAddress: string): Promise<ReferralStats> {
  if (!supabase) {
    return {
      totalReferrals: 0,
      completedReferrals: 0,
      totalRewards: 0,
      pendingRewards: 0,
    };
  }

  const normalized = walletAddress.toLowerCase().trim();

  const { data: referrals, error } = await supabase
    .from("referrals")
    .select("status, reward_nop")
    .eq("referrer_address", normalized);

  if (error) {
    console.error("[referral] Failed to fetch stats", error);
    return {
      totalReferrals: 0,
      completedReferrals: 0,
      totalRewards: 0,
      pendingRewards: 0,
    };
  }

  const totalReferrals = referrals?.length || 0;
  const completedReferrals = referrals?.filter((r) => r.status === "completed").length || 0;
  const totalRewards = referrals?.reduce((sum, r) => sum + Number(r.reward_nop || 0), 0) || 0;
  const pendingRewards =
    referrals?.filter((r) => r.status === "pending").reduce((sum, r) => sum + Number(r.reward_nop || 0), 0) || 0;

  return {
    totalReferrals,
    completedReferrals,
    totalRewards,
    pendingRewards,
  };
}

/**
 * Get all referrals for a wallet
 */
export async function getReferrals(walletAddress: string): Promise<Referral[]> {
  if (!supabase) {
    return [];
  }

  const normalized = walletAddress.toLowerCase().trim();

  const { data: referrals, error } = await supabase
    .from("referrals")
    .select("*")
    .eq("referrer_address", normalized)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[referral] Failed to fetch referrals", error);
    return [];
  }

  return (
    referrals?.map((r) => ({
      id: r.id,
      referrerAddress: r.referrer_address,
      referredAddress: r.referred_address,
      referralCode: r.referral_code,
      rewardNop: Number(r.reward_nop),
      status: r.status,
      completedAt: r.completed_at,
      createdAt: r.created_at,
    })) || []
  );
}

