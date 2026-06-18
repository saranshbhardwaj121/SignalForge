export interface WatchlistItem {
  id: string;
  ticker: string;
  created_at: string;
}

export interface Watchlist {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  items: WatchlistItem[];
}

export interface WatchlistQuoteItem {
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
  provider: string | null;
  fetched_at: string | null;
  error: string | null;
}

export interface WatchlistQuotesResponse {
  watchlist_id: string;
  watchlist_name: string;
  quotes: WatchlistQuoteItem[];
  fetched_at: string;
}
