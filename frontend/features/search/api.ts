import { clientFetch } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import type { SearchResponse } from "./types";

export async function searchTickers(
  query: string,
  limit?: number
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query });
  if (limit) params.set("limit", String(limit));
  return clientFetch<SearchResponse>(
    `${API_ROUTES.MARKET_DATA.SEARCH(query)}&${params.toString()}`
  );
}
