import type { ReactNode } from 'react';

export interface BurnSeriesPoint {
  t: number;
  v: number;
}

export interface BurnStats {
  total: number;
  last24h: number;
  series?: BurnSeriesPoint[];
  updatedAt?: string;
}

export interface BoostEvent {
  id: string;
  title: string;
  badge?: 'x2' | 'x3';
  expiresAt: string;
  cta: {
    label: string;
    href: string;
  };
  icon?: ReactNode;
}
