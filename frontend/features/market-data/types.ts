export interface Quote {
  ticker: string;
  name: string | null;
  currency: string | null;
  price: number | null;
  previous_close: number | null;
  open: number | null;
  day_high: number | null;
  day_low: number | null;
  volume: number | null;
  market_cap: number | null;
  exchange: string | null;
  provider: string;
  fetched_at: string;
}

export interface HistoricalBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalData {
  ticker: string;
  period: string;
  interval: string;
  rows: HistoricalBar[];
  provider: string;
  cached: boolean;
  fetched_at: string;
}
