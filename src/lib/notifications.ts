import { supabase } from "@/lib/supabaseClient";

export type NotificationType =
  | "new_contribute"
  | "price_alert"
  | "lp_reward"
  | "creator_earnings"
  | "mention"
  | "follow";

export type Notification = {
  id: string;
  user_address: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

/**
 * Create a notification
 */
export async function createNotification(params: {
  userAddress: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}): Promise<boolean> {
  const client = supabase;
  if (!client) return false;

  try {
    const { error } = await client
      .from("notifications")
      .insert({
        user_address: params.userAddress.toLowerCase(),
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
        read: false,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.warn("[notifications] Failed to create notification", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[notifications] Error creating notification", error);
    return false;
  }
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userAddress: string,
  limit: number = 50
): Promise<Notification[]> {
  const client = supabase;
  if (!client) return [];

  try {
    const { data, error } = await client
      .from("notifications")
      .select("*")
      .eq("user_address", userAddress.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("[notifications] Failed to get notifications", error);
      return [];
    }

    return (data || []) as Notification[];
  } catch (error) {
    console.error("[notifications] Error getting notifications", error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<boolean> {
  const client = supabase;
  if (!client) return false;

  try {
    const { error } = await client
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      console.warn("[notifications] Failed to mark notification as read", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[notifications] Error marking notification as read", error);
    return false;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(userAddress: string): Promise<boolean> {
  const client = supabase;
  if (!client) return false;

  try {
    const { error } = await client
      .from("notifications")
      .update({ read: true })
      .eq("user_address", userAddress.toLowerCase())
      .eq("read", false);

    if (error) {
      console.warn("[notifications] Failed to mark all notifications as read", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[notifications] Error marking all notifications as read", error);
    return false;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userAddress: string): Promise<number> {
  const client = supabase;
  if (!client) return 0;

  try {
    const { count, error } = await client
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_address", userAddress.toLowerCase())
      .eq("read", false);

    if (error) {
      console.warn("[notifications] Failed to get unread count", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("[notifications] Error getting unread count", error);
    return 0;
  }
}

