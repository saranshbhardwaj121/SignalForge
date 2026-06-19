export interface IndicatorPoint {
  date: string;
  close: number;
  value: number | null;
}

export interface IndicatorResponse {
  ticker: string;
  indicator: string;
  period: string;
  interval: string;
  parameters: Record<string, number>;
  rows: IndicatorPoint[];
  latest: IndicatorPoint | null;
  provider: string;
  cached: boolean;
  fetched_at: string;
}

export interface MacdPoint {
  date: string;
  close: number;
  macd: number | null;
  signal: number | null;
  histogram: number | null;
}

export interface MacdResponse {
  ticker: string;
  indicator: string;
  period: string;
  interval: string;
  parameters: Record<string, number>;
  rows: MacdPoint[];
  latest: MacdPoint | null;
  provider: string;
  cached: boolean;
  fetched_at: string;
}
