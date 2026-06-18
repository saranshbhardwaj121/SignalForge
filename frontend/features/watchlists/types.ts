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
