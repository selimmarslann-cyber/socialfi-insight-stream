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
