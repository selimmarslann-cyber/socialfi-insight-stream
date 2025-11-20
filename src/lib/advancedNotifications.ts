/**
 * Advanced Notifications System
 * Handles push, email, and in-app notifications with preferences
 */

import { supabase } from "@/lib/supabaseClient";
import { createNotification } from "@/lib/notifications";

export type NotificationPreference = {
  email: boolean;
  push: boolean;
  inApp: boolean;
  posts: boolean;
  mentions: boolean;
  rewards: boolean;
  priceAlerts: boolean;
  lpRewards: boolean;
  creatorEarnings: boolean;
};

export type NotificationChannel = "email" | "push" | "in_app";

/**
 * Get notification preferences for a wallet
 */
export async function getNotificationPreferences(walletAddress: string): Promise<NotificationPreference> {
  if (!supabase) {
    return {
      email: true,
      push: true,
      inApp: true,
      posts: true,
      mentions: true,
      rewards: true,
      priceAlerts: true,
      lpRewards: true,
      creatorEarnings: true,
    };
  }

  const normalized = walletAddress.toLowerCase().trim();

  const { data: profile } = await supabase
    .from("social_profiles")
    .select("notification_preferences, email_notifications_enabled, push_notifications_enabled")
    .eq("wallet_address", normalized)
    .single();

  if (!profile) {
    return {
      email: true,
      push: true,
      inApp: true,
      posts: true,
      mentions: true,
      rewards: true,
      priceAlerts: true,
      lpRewards: true,
      creatorEarnings: true,
    };
  }

  const prefs = (profile.notification_preferences as NotificationPreference) || {};

  return {
    email: profile.email_notifications_enabled ?? prefs.email ?? true,
    push: profile.push_notifications_enabled ?? prefs.push ?? true,
    inApp: prefs.inApp ?? true,
    posts: prefs.posts ?? true,
    mentions: prefs.mentions ?? true,
    rewards: prefs.rewards ?? true,
    priceAlerts: prefs.priceAlerts ?? true,
    lpRewards: prefs.lpRewards ?? true,
    creatorEarnings: prefs.creatorEarnings ?? true,
  };
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  walletAddress: string,
  preferences: Partial<NotificationPreference>
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }

  const normalized = walletAddress.toLowerCase().trim();

  // Get current preferences
  const current = await getNotificationPreferences(normalized);

  // Merge with new preferences
  const updated: NotificationPreference = {
    ...current,
    ...preferences,
  };

  const { error } = await supabase
    .from("social_profiles")
    .update({
      notification_preferences: updated,
      email_notifications_enabled: updated.email,
      push_notifications_enabled: updated.push,
    })
    .eq("wallet_address", normalized);

  if (error) throw error;
}

/**
 * Send notification with channel routing
 */
export async function sendNotification(
  userAddress: string,
  type: "new_contribute" | "price_alert" | "lp_reward" | "creator_earnings" | "mention" | "follow",
  title: string,
  message: string,
  link?: string
): Promise<void> {
  if (!supabase) {
    console.warn("[notifications] Supabase not configured");
    return;
  }

  const normalized = userAddress.toLowerCase().trim();
  const preferences = await getNotificationPreferences(normalized);

  // Check if this notification type is enabled
  let enabled = false;
  switch (type) {
    case "new_contribute":
      enabled = preferences.posts;
      break;
    case "mention":
      enabled = preferences.mentions;
      break;
    case "price_alert":
    case "lp_reward":
    case "creator_earnings":
      enabled = preferences.rewards;
      break;
    case "follow":
      enabled = preferences.posts;
      break;
  }

  if (!enabled) {
    return; // User has disabled this notification type
  }

  // Create in-app notification
  if (preferences.inApp) {
    await createNotification({
      userAddress: normalized,
      type,
      title,
      message,
      link,
    });
  }

  // Send email notification (would integrate with email service)
  if (preferences.email) {
    await sendEmailNotification(normalized, title, message, link);
  }

  // Send push notification (would integrate with push service)
  if (preferences.push) {
    await sendPushNotification(normalized, title, message, link);
  }
}

/**
 * Send email notification (placeholder - would integrate with SendGrid, AWS SES, etc.)
 */
async function sendEmailNotification(
  userAddress: string,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  // This would integrate with an email service
  // For now, we just mark it as sent in the database
  if (!supabase) return;

  // Update the most recent notification to mark email as sent
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_address", userAddress)
    .order("created_at", { ascending: false })
    .limit(1);

  if (notifications && notifications.length > 0) {
    await supabase
      .from("notifications")
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq("id", notifications[0].id);
  }

  console.log("[notifications] Email notification sent", { userAddress, title });
}

/**
 * Send push notification (placeholder - would integrate with FCM, OneSignal, etc.)
 */
async function sendPushNotification(
  userAddress: string,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  // This would integrate with a push notification service
  // For now, we just mark it as sent in the database
  if (!supabase) return;

  // Update the most recent notification to mark push as sent
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_address", userAddress)
    .order("created_at", { ascending: false })
    .limit(1);

  if (notifications && notifications.length > 0) {
    await supabase
      .from("notifications")
      .update({
        push_sent: true,
        push_sent_at: new Date().toISOString(),
      })
      .eq("id", notifications[0].id);
  }

  console.log("[notifications] Push notification sent", { userAddress, title });
}

/**
 * Request push notification permission
 */
export async function requestPushPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

/**
 * Show browser notification
 */
export function showBrowserNotification(title: string, options?: NotificationOptions): void {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });
  }
}

