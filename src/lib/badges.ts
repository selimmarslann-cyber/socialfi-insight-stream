/**
 * Gamification System - Badges & Achievements
 * Rewards users for milestones and achievements
 */

import { supabase } from "@/lib/supabaseClient";

export type Badge = {
  id: string;
  badgeKey: string;
  name: string;
  description?: string;
  iconUrl?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  category: "general" | "trading" | "social" | "achievement" | "special";
  createdAt: string;
};

export type UserBadge = {
  id: string;
  walletAddress: string;
  badgeId: string;
  badge?: Badge;
  earnedAt: string;
  metadata?: Record<string, unknown>;
};

const BADGE_DEFINITIONS: Omit<Badge, "id" | "createdAt">[] = [
  {
    badgeKey: "first_post",
    name: "First Contribution",
    description: "Shared your first contribution",
    rarity: "common",
    category: "social",
  },
  {
    badgeKey: "first_trade",
    name: "First Trade",
    description: "Completed your first trade",
    rarity: "common",
    category: "trading",
  },
  {
    badgeKey: "10_posts",
    name: "Active Contributor",
    description: "Shared 10 contributions",
    rarity: "rare",
    category: "social",
  },
  {
    badgeKey: "100_posts",
    name: "Power User",
    description: "Shared 100 contributions",
    rarity: "epic",
    category: "social",
  },
  {
    badgeKey: "first_follower",
    name: "Influencer",
    description: "Gained your first follower",
    rarity: "common",
    category: "social",
  },
  {
    badgeKey: "10_followers",
    name: "Rising Star",
    description: "Gained 10 followers",
    rarity: "rare",
    category: "social",
  },
  {
    badgeKey: "100_followers",
    name: "Community Leader",
    description: "Gained 100 followers",
    rarity: "epic",
    category: "social",
  },
  {
    badgeKey: "alpha_score_50",
    name: "Alpha Trader",
    description: "Achieved Alpha Score of 50",
    rarity: "rare",
    category: "trading",
  },
  {
    badgeKey: "alpha_score_80",
    name: "Elite Trader",
    description: "Achieved Alpha Score of 80",
    rarity: "epic",
    category: "trading",
  },
  {
    badgeKey: "alpha_score_95",
    name: "Legendary Trader",
    description: "Achieved Alpha Score of 95",
    rarity: "legendary",
    category: "trading",
  },
  {
    badgeKey: "first_referral",
    name: "Network Builder",
    description: "Referred your first user",
    rarity: "common",
    category: "achievement",
  },
  {
    badgeKey: "10_referrals",
    name: "Community Builder",
    description: "Referred 10 users",
    rarity: "rare",
    category: "achievement",
  },
  {
    badgeKey: "early_adopter",
    name: "Early Adopter",
    description: "Joined in the first 1000 users",
    rarity: "epic",
    category: "special",
  },
  {
    badgeKey: "whale",
    name: "Whale",
    description: "Traded over 100,000 NOP",
    rarity: "epic",
    category: "trading",
  },
  {
    badgeKey: "perfect_week",
    name: "Perfect Week",
    description: "100% win rate for a week",
    rarity: "legendary",
    category: "trading",
  },
];

/**
 * Initialize badge definitions in database
 */
export async function initializeBadges(): Promise<void> {
  if (!supabase) {
    console.warn("[badges] Supabase not configured");
    return;
  }

  try {
    for (const badgeDef of BADGE_DEFINITIONS) {
      await supabase
        .from("badges")
        .upsert(
          {
            badge_key: badgeDef.badgeKey,
            name: badgeDef.name,
            description: badgeDef.description,
            icon_url: badgeDef.iconUrl,
            rarity: badgeDef.rarity,
            category: badgeDef.category,
          },
          {
            onConflict: "badge_key",
          }
        );
    }
  } catch (error) {
    console.error("[badges] Failed to initialize badges", error);
  }
}

/**
 * Award a badge to a user
 */
export async function awardBadge(
  walletAddress: string,
  badgeKey: string,
  metadata?: Record<string, unknown>
): Promise<UserBadge | null> {
  if (!supabase) {
    console.warn("[badges] Supabase not configured");
    return null;
  }

  const normalized = walletAddress.toLowerCase().trim();

  try {
    // Find badge by key
    const { data: badge, error: badgeError } = await supabase
      .from("badges")
      .select("*")
      .eq("badge_key", badgeKey)
      .single();

    if (badgeError || !badge) {
      console.error("[badges] Badge not found", badgeKey);
      return null;
    }

    // Check if user already has this badge
    const { data: existing } = await supabase
      .from("user_badges")
      .select("id")
      .eq("wallet_address", normalized)
      .eq("badge_id", badge.id)
      .single();

    if (existing) {
      // User already has this badge
      return null;
    }

    // Award badge
    const { data: userBadge, error: insertError } = await supabase
      .from("user_badges")
      .insert({
        wallet_address: normalized,
        badge_id: badge.id,
        metadata: metadata || null,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("[badges] Failed to award badge", insertError);
      return null;
    }

    return {
      id: userBadge.id,
      walletAddress: userBadge.wallet_address,
      badgeId: userBadge.badge_id,
      badge: {
        id: badge.id,
        badgeKey: badge.badge_key,
        name: badge.name,
        description: badge.description,
        iconUrl: badge.icon_url,
        rarity: badge.rarity,
        category: badge.category,
        createdAt: badge.created_at,
      },
      earnedAt: userBadge.earned_at,
      metadata: userBadge.metadata as Record<string, unknown> | undefined,
    };
  } catch (error) {
    console.error("[badges] Error awarding badge", error);
    return null;
  }
}

/**
 * Get all badges for a user
 */
export async function getUserBadges(walletAddress: string): Promise<UserBadge[]> {
  if (!supabase) {
    return [];
  }

  const normalized = walletAddress.toLowerCase().trim();

  try {
    const { data: userBadges, error } = await supabase
      .from("user_badges")
      .select(
        `
        *,
        badges (
          id,
          badge_key,
          name,
          description,
          icon_url,
          rarity,
          category,
          created_at
        )
      `
      )
      .eq("wallet_address", normalized)
      .order("earned_at", { ascending: false });

    if (error) {
      console.error("[badges] Failed to fetch user badges", error);
      return [];
    }

    return (
      userBadges?.map((ub) => ({
        id: ub.id,
        walletAddress: ub.wallet_address,
        badgeId: ub.badge_id,
        badge: ub.badges
          ? {
              id: ub.badges.id,
              badgeKey: ub.badges.badge_key,
              name: ub.badges.name,
              description: ub.badges.description,
              iconUrl: ub.badges.icon_url,
              rarity: ub.badges.rarity,
              category: ub.badges.category,
              createdAt: ub.badges.created_at,
            }
          : undefined,
        earnedAt: ub.earned_at,
        metadata: ub.metadata as Record<string, unknown> | undefined,
      })) || []
    );
  } catch (error) {
    console.error("[badges] Error fetching user badges", error);
    return [];
  }
}

/**
 * Check and award badges based on user activity
 */
export async function checkAndAwardBadges(walletAddress: string): Promise<UserBadge[]> {
  if (!supabase) {
    return [];
  }

  const normalized = walletAddress.toLowerCase().trim();
  const awarded: UserBadge[] = [];

  try {
    // Check post count
    const { count: postCount } = await supabase
      .from("social_posts")
      .select("*", { count: "exact", head: true })
      .eq("wallet_address", normalized);

    if (postCount === 1) {
      const badge = await awardBadge(normalized, "first_post");
      if (badge) awarded.push(badge);
    } else if (postCount === 10) {
      const badge = await awardBadge(normalized, "10_posts");
      if (badge) awarded.push(badge);
    } else if (postCount === 100) {
      const badge = await awardBadge(normalized, "100_posts");
      if (badge) awarded.push(badge);
    }

    // Check follower count
    const { count: followerCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_address", normalized);

    if (followerCount === 1) {
      const badge = await awardBadge(normalized, "first_follower");
      if (badge) awarded.push(badge);
    } else if (followerCount === 10) {
      const badge = await awardBadge(normalized, "10_followers");
      if (badge) awarded.push(badge);
    } else if (followerCount === 100) {
      const badge = await awardBadge(normalized, "100_followers");
      if (badge) awarded.push(badge);
    }

    // Check referral count
    const { data: profile } = await supabase
      .from("social_profiles")
      .select("referral_count")
      .eq("wallet_address", normalized)
      .single();

    if (profile?.referral_count === 1) {
      const badge = await awardBadge(normalized, "first_referral");
      if (badge) awarded.push(badge);
    } else if (profile?.referral_count === 10) {
      const badge = await awardBadge(normalized, "10_referrals");
      if (badge) awarded.push(badge);
    }

    // Check Alpha Score (would need to fetch from reputation_scores)
    // This is a placeholder - actual implementation would check reputation_scores table

    return awarded;
  } catch (error) {
    console.error("[badges] Error checking badges", error);
    return awarded;
  }
}

