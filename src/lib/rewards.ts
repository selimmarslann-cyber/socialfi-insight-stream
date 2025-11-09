import type { BoostKey } from '@/types/rewards';

const STORAGE_KEY = 'claimedRewards';

const isBrowser = () => typeof window !== 'undefined';

type ClaimMap = Record<string, number>;

const readClaims = (): ClaimMap => {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as ClaimMap;
    }
  } catch {
    // ignore parse errors
  }
  return {};
};

const writeClaims = (claims: ClaimMap) => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
  } catch {
    // ignore write errors
  }
};

export function hasClaimed(user: string, key: BoostKey) {
  const claims = readClaims();
  return Boolean(claims[`${user}:${key}`]);
}

export function markClaimed(user: string, key: BoostKey) {
  const claims = readClaims();
  claims[`${user}:${key}`] = Date.now();
  writeClaims(claims);
}
