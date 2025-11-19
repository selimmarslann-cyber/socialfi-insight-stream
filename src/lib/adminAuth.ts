/**
 * Preview-only admin auth helper.
 * This is intentionally client-side and NOT secure.
 * Do not ship this pattern to production environments.
 */
const ADMIN_KEY = "nop_admin_session_v2";

const readEnv = (key: string, fallback: string) => {
  if (typeof import.meta !== "undefined" && import.meta.env?.[key]) {
    return import.meta.env[key] as string;
  }
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key] as string;
  }
  return fallback;
};

const ADMIN_USERNAME = readEnv("VITE_ADMIN_USERNAME", "selimarslan");
const ADMIN_PASSWORD = readEnv("VITE_ADMIN_PASSWORD", "selimarslan");

const isBrowser = () => typeof window !== "undefined";

export function isAdminLoggedIn(): boolean {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(ADMIN_KEY) === "1";
}

export function loginAsAdmin(username: string, password: string): boolean {
  const isValid = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
  if (isValid && isBrowser()) {
    window.localStorage.setItem(ADMIN_KEY, "1");
  }
  return isValid;
}

export function logoutAdmin(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ADMIN_KEY);
}
