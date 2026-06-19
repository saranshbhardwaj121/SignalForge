export interface SignalDetail {
  name: string;
  action: string;
  score: number;
  confidence: number;
  reason: string;
  signal_date: string | null;
  close: number | null;
  metadata: Record<string, unknown>;
}

export interface SignalSummary {
  ticker: string;
  rating: string;
  score: number;
  confidence: number;
  period: string;
  interval: string;
  parameters: Record<string, number | string>;
  signals: SignalDetail[];
  provider: string;
  cached: boolean;
  fetched_at: string;
  generated_at: string;
}

export interface WatchlistSignalItem {
  ticker: string;
  summary: SignalSummary | null;
  error: string | null;
}

export interface WatchlistSignalsResponse {
  watchlist_id: string;
  watchlist_name: string;
  period: string;
  interval: string;
  parameters: Record<string, number>;
  signals: WatchlistSignalItem[];
  generated_at: string;
}
