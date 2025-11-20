/**
 * Secure Admin Authentication
 * Server-side JWT validation (replaces insecure localStorage-based auth)
 */

import { supabase } from "@/lib/supabaseClient";

export type AdminAuthResult = {
  isAdmin: boolean;
  userId?: string;
  error?: string;
};

/**
 * Check if current user is admin (server-side validation)
 * This replaces the insecure localStorage check
 */
export async function isAdminAuthenticated(): Promise<AdminAuthResult> {
  try {
    if (!supabase) {
      return { isAdmin: false, error: "Supabase not configured" };
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { isAdmin: false, error: "Not authenticated" };
    }

    // Check if user has admin role in database
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { isAdmin: false, error: "Profile not found" };
    }

    return {
      isAdmin: profile.is_admin === true,
      userId: user.id,
    };
  } catch (error) {
    console.error("[adminAuthSecure] Error checking admin status:", error);
    return { isAdmin: false, error: "Authentication check failed" };
  }
}

/**
 * Login as admin (requires valid Supabase session)
 * In production, this should be handled by Supabase Auth
 */
export async function loginAsAdminSecure(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: "Supabase not configured" };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { success: false, error: error?.message || "Login failed" };
    }

    // Verify user is admin
    const adminCheck = await isAdminAuthenticated();
    if (!adminCheck.isAdmin) {
      // Logout if not admin
      await supabase.auth.signOut();
      return { success: false, error: "Access denied. Admin privileges required." };
    }

    return { success: true };
  } catch (error) {
    console.error("[adminAuthSecure] Login error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
    };
  }
}

/**
 * Logout admin
 */
export async function logoutAdminSecure(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error("[adminAuthSecure] Logout error:", error);
  }
}

/**
 * Client-side check (for UI rendering, but not for security)
 * Always verify server-side before allowing admin actions
 */
export function isAdminLoggedInClient(): boolean {
  // This is only for UI state, not security
  // Real security check must be done server-side
  if (typeof window === "undefined") return false;
  
  // Check if we have a Supabase session
  // In production, this should check JWT token validity
  const sessionKey = "sb-auth-token";
  return localStorage.getItem(sessionKey) !== null;
}

