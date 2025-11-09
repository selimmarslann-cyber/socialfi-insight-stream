export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'nil-theme';
const EVENT_NAME = 'theme-change';

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

function readStoredTheme(): ThemeMode | null {
  if (!isBrowser()) return null;
  const value = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  return value === 'light' || value === 'dark' ? value : null;
}

export function getSystem(): ThemeMode {
  if (!isBrowser()) return 'light';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getTheme(): ThemeMode {
  return readStoredTheme() ?? getSystem();
}

function applyThemeAttributes(mode: ThemeMode) {
  if (!isBrowser()) return;
  const root = document.documentElement;
  root.setAttribute('data-theme', mode);
  root.classList.toggle('dark', mode === 'dark');
  root.classList.toggle('light', mode === 'light');
}

function dispatchThemeChange(mode: ThemeMode) {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent<ThemeMode>(EVENT_NAME, { detail: mode }));
}

export function setTheme(mode: ThemeMode) {
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
  const next = getTheme() === 'light' ? 'dark' : 'light';
  setTheme(next);
  return next;
}

export function initTheme() {
  const initial = getTheme();
  applyThemeAttributes(initial);
  dispatchThemeChange(initial);
}

export function subscribeTheme(listener: (mode: ThemeMode) => void) {
  if (!isBrowser()) return () => {};
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<ThemeMode>).detail ?? getTheme();
    listener(detail);
  };
  const storageHandler = (event: StorageEvent) => {
    if (
      event.key === STORAGE_KEY &&
      (event.newValue === 'light' || event.newValue === 'dark')
    ) {
      listener(event.newValue);
    }
  };
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', storageHandler);
  };
}
