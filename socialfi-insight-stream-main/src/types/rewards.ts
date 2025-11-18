export type BoostKey = 'signup' | 'deposit' | 'contribute';

export interface BoostConfig {
  key: BoostKey;
  title: string;
  reward: number;
  href: string;
}
