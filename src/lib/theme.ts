export type ThemePreference = "light" | "dark" | "system";
export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "nil-theme";
const EVENT_NAME = "theme-change";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

const isBrowser = () =>
  typeof window !== "undefined" && typeof document !== "undefined";

let systemListenerAttached = false;
let systemMediaQuery: MediaQueryList | null = null;

function readStoredTheme(): ThemePreference | null {
  if (!isBrowser()) return null;
  const value = window.localStorage.getItem(STORAGE_KEY) as
    | ThemePreference
    | null;
  return value === "light" || value === "dark" || value === "system"
    ? value
    : null;
}

export function getSystem(): ThemeMode {
  if (!isBrowser()) return "light";
  return window.matchMedia?.(MEDIA_QUERY).matches ? "dark" : "light";
}

export function getThemePreference(): ThemePreference {
  return readStoredTheme() ?? "system";
}

const resolveTheme = (mode: ThemePreference): ThemeMode => {
  return mode === "system" ? getSystem() : mode;
};

export function getTheme(): ThemeMode {
  return resolveTheme(getThemePreference());
}

function applyThemeAttributes(mode: ThemePreference) {
  if (!isBrowser()) return;
  const resolved = resolveTheme(mode);
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-theme-setting", mode);
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
}

function dispatchThemeChange(mode: ThemePreference) {
  if (!isBrowser()) return;
  window.dispatchEvent(
    new CustomEvent<ThemePreference>(EVENT_NAME, { detail: mode }),
  );
}

function attachSystemListener() {
  if (!isBrowser() || systemListenerAttached) return;
  systemMediaQuery = window.matchMedia?.(MEDIA_QUERY) ?? null;
  if (!systemMediaQuery) return;
  const handler = () => {
    if (getThemePreference() === "system") {
      applyThemeAttributes("system");
      dispatchThemeChange("system");
    }
  };

  if (typeof systemMediaQuery.addEventListener === "function") {
    systemMediaQuery.addEventListener("change", handler);
    systemListenerAttached = true;
  } else if (typeof systemMediaQuery.addListener === "function") {
    systemMediaQuery.addListener(handler);
    systemListenerAttached = true;
  }
}

export function setTheme(mode: ThemePreference) {
  applyThemeAttributes(mode);
  if (isBrowser()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore storage errors
    }
  }
  dispatchThemeChange(mode);
}

export function toggleTheme() {
  const preference = getThemePreference();
  const next = preference === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export function initTheme() {
  const initial = getThemePreference();
  applyThemeAttributes(initial);
  attachSystemListener();
  dispatchThemeChange(initial);
}

export function subscribeTheme(listener: (mode: ThemePreference) => void) {
  if (!isBrowser()) return () => {};
  const handler = (event: Event) => {
    const detail =
      (event as CustomEvent<ThemePreference>).detail ?? getThemePreference();
    listener(detail);
  };
  const storageHandler = (event: StorageEvent) => {
    if (
      event.key === STORAGE_KEY &&
      (event.newValue === "light" ||
        event.newValue === "dark" ||
        event.newValue === "system")
    ) {
      listener(event.newValue);
    }
  };
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", storageHandler);
  attachSystemListener();
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", storageHandler);
  };
}
