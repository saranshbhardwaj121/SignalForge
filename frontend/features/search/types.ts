export interface SearchResultItem {
  ticker: string;
  name: string | null;
  exchange: string | null;
  type: string | null;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
}
