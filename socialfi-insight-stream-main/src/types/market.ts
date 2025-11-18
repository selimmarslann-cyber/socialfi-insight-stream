export interface TopGainer {
  symbol: string;
  price: number;
  changePercent: number;
  volume24h?: number;
}

export interface MarketData {
  gainers: TopGainer[];
  lastUpdate: string;
}
