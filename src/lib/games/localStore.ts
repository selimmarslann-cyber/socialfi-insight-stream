// NOTE: This games module is experimental and not part of the core NOP Intelligence Layer
// production app. It is currently excluded from navigation and main flows as of PHASE 2.
export type GameKey = 'nopchart' | 'flappy' | 'runner' | 'memory' | 'reaction';

export type ScoreRow = { score: number; ts: number; address?: string };

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const read = <T>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // noop
  }
};

export const getScores = (key: GameKey): ScoreRow[] => read<ScoreRow[]>(`${key}_scores`, []);

export const addScore = (key: GameKey, row: ScoreRow) => {
  const arr = [...getScores(key), row];
  write(`${key}_scores`, arr);
};

export const bestOf = (key: GameKey) => {
  const arr = getScores(key);
  if (!arr.length) return 0;
  if (key === 'memory' || key === 'reaction') {
    return Math.min(...arr.map((x) => x.score));
  }
  return Math.max(...arr.map((x) => x.score));
};

export type UserSettings = {
  address: string;
  banned?: boolean;
  rewardsPaused?: boolean;
  capEnabled?: boolean;
  capNOP?: number;
};

const ADMIN_KEY = 'games_admin_settings_v1';

export const getAllSettings = (): UserSettings[] => read<UserSettings[]>(ADMIN_KEY, []);

export const getSettings = (address: string): UserSettings | undefined => {
  const lower = address?.toLowerCase();
  return getAllSettings().find((entry) => entry.address?.toLowerCase() === lower);
};

export const setSettings = (value: UserSettings) => {
  const lower = value.address?.toLowerCase();
  const next = getAllSettings().filter((entry) => entry.address?.toLowerCase() !== lower);
  next.push(value);
  write(ADMIN_KEY, next);
};

export const getEarnedNop = (address: string, game?: GameKey) => {
  const map: Record<GameKey, (score: number) => number> = {
    nopchart: () => 0,
    flappy: (score) => Math.floor(score / 10),
    runner: (score) => Math.floor(score / 1000),
    memory: (score) => (score <= 10 ? 3 : score <= 20 ? 1 : 0),
    reaction: (score) => (score < 200 ? 3 : score < 250 ? 2 : score < 300 ? 1 : 0),
  };

  const keys: GameKey[] = game ? [game] : ['nopchart', 'flappy', 'runner', 'memory', 'reaction'];

  return keys.reduce((sum, key) => {
    const scores = getScores(key);
    const earned = scores
      .filter((row) => row.address === address)
      .reduce((acc, row) => acc + map[key](row.score), 0);
    return sum + earned;
  }, 0);
};
