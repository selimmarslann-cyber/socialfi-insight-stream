export interface BurnStats {
  totalBurned: number;
  last24h: number;
  lastUpdate: string;
}

export interface BoostEvent {
  id: string;
  title: string;
  description: string;
  multiplier: number;
  startDate: string;
  endDate: string;
  active: boolean;
}
